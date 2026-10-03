import "server-only";

import { generateText, Output } from "ai";
import { canManageSecrets, type StaffRole } from "@/lib/auth/roles";
import { createGoogleProvider, GOOGLE_SECRET_REF, googleApiKeyConfigured, isProviderAuthError, maskedGoogleKeySuffix, sanitizeAiError } from "@/lib/ai/provider";
import { healthPingSchema } from "@/lib/ai/schemas";
import type { GenerationHealth, SecretHealth } from "@/lib/ai/types";
import { writeAudit, type StaffClient } from "@/lib/cms/server";
import { createServiceSupabaseClient } from "@/lib/supabase/service";

const AUTH_FAILURE_DISABLE_AFTER = 3;

function secretClient(userClient: StaffClient, superAdmin: boolean): StaffClient {
  if (superAdmin) return userClient;
  try {
    return createServiceSupabaseClient();
  } catch {
    return userClient;
  }
}

export async function readGenerationHealth(client: StaffClient, role: string | null): Promise<GenerationHealth> {
  const configured = googleApiKeyConfigured();
  const superAdmin = canManageSecrets(role as StaffRole | null);
  let health: SecretHealth | null = null;
  let maskedSuffix: string | null = null;
  let lastError: string | null = null;
  let lastTestedAt: string | null = null;
  let disabled = false;

  try {
    const reader = secretClient(client, superAdmin);
    const { data } = await reader
      .from("integration_secret_refs")
      .select("health_status, masked_suffix, last_error, last_tested_at, is_active")
      .eq("secret_ref", GOOGLE_SECRET_REF)
      .maybeSingle();
    if (data) {
      health = (data.health_status as SecretHealth) ?? "unknown";
      maskedSuffix = superAdmin ? String(data.masked_suffix ?? "env") : null;
      lastError = superAdmin && typeof data.last_error === "string" ? sanitizeAiError(data.last_error) : null;
      lastTestedAt = typeof data.last_tested_at === "string" ? data.last_tested_at : null;
      disabled = data.is_active === false || health === "disabled";
    }
  } catch {
    health = configured ? "unknown" : null;
  }

  return {
    configured,
    health: superAdmin ? health : configured ? health === "disabled" ? "disabled" : "unknown" : null,
    maskedSuffix,
    lastError,
    lastTestedAt,
    disabled: disabled || !configured,
  };
}

async function patchSecretRef(
  client: StaffClient,
  superAdmin: boolean,
  patch: Record<string, unknown>,
) {
  try {
    const writer = secretClient(client, superAdmin);
    await writer.from("integration_secret_refs").update(patch).eq("secret_ref", GOOGLE_SECRET_REF);
  } catch {
    // Health metadata is best-effort and must not fail a valid draft save.
  }
}

export async function recordProviderResult(input: {
  client: StaffClient;
  role: string | null;
  error?: unknown;
}) {
  const superAdmin = canManageSecrets(input.role as StaffRole | null);
  if (input.error && isProviderAuthError(input.error)) {
    const { data } = await secretClient(input.client, superAdmin)
      .from("integration_secret_refs")
      .select("consecutive_auth_failures")
      .eq("secret_ref", GOOGLE_SECRET_REF)
      .maybeSingle();
    const failures = (typeof data?.consecutive_auth_failures === "number" ? data.consecutive_auth_failures : 0) + 1;
    const disable = failures >= AUTH_FAILURE_DISABLE_AFTER;
    await patchSecretRef(input.client, superAdmin, {
      health_status: disable ? "disabled" : "degraded",
      consecutive_auth_failures: failures,
      last_error: sanitizeAiError(input.error),
      last_tested_at: new Date().toISOString(),
      is_active: !disable,
    });
    return;
  }
  if (input.error) {
    await patchSecretRef(input.client, superAdmin, {
      health_status: "degraded",
      last_error: sanitizeAiError(input.error),
      last_tested_at: new Date().toISOString(),
    });
    return;
  }
  await patchSecretRef(input.client, superAdmin, {
    health_status: "healthy",
    consecutive_auth_failures: 0,
    last_error: null,
    last_tested_at: new Date().toISOString(),
    masked_suffix: maskedGoogleKeySuffix(),
    is_active: true,
  });
}

export async function assertGenerationAvailable(client: StaffClient, role: string | null) {
  const health = await readGenerationHealth(client, role);
  if (!health.configured) {
    return { ok: false as const, error: "Google AI is not configured on the server.", code: "unconfigured" as const, health };
  }
  if (health.disabled) {
    return { ok: false as const, error: "Generation is disabled after repeated authentication errors.", code: "disabled" as const, health };
  }
  return { ok: true as const, health };
}

export async function testGoogleConnection(input: {
  client: StaffClient;
  role: string | null;
  actorId: string;
}) {
  if (!canManageSecrets(input.role as StaffRole | null)) {
    return { ok: false as const, error: "Only a super admin can test the provider key." };
  }
  if (!googleApiKeyConfigured()) {
    return { ok: false as const, error: "GOOGLE_GENERATIVE_AI_API_KEY is not set." };
  }
  try {
    const google = createGoogleProvider();
    await generateText({
      model: google("gemini-3.5-flash-lite"),
      output: Output.object({ schema: healthPingSchema, name: "HealthPing" }),
      prompt: 'Return {"ok": true} to confirm the server can reach Google AI.',
      maxOutputTokens: 64,
    });
    await recordProviderResult({ client: input.client, role: input.role });
    await writeAudit(input.client, {
      actorId: input.actorId,
      action: "ai.connection_test",
      entityType: "integration_secret_ref",
      metadata: { secretRef: GOOGLE_SECRET_REF, result: "healthy" },
    });
    return { ok: true as const, message: "Google AI responded." };
  } catch (error) {
    await recordProviderResult({ client: input.client, role: input.role, error });
    await writeAudit(input.client, {
      actorId: input.actorId,
      action: "ai.connection_test",
      entityType: "integration_secret_ref",
      metadata: { secretRef: GOOGLE_SECRET_REF, result: "failed" },
    });
    return { ok: false as const, error: sanitizeAiError(error) };
  }
}
