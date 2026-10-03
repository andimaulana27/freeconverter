import "server-only";

import { randomUUID } from "node:crypto";
import { generateText, Output } from "ai";
import { canManageSecrets, type StaffRole } from "@/lib/auth/roles";
import {
  cacheResolvedGoogleSecret,
  createGoogleProvider,
  GOOGLE_PROVIDER,
  GOOGLE_SECRET_ENV,
  GOOGLE_SECRET_REF,
  googleApiKeyConfigured,
  isProviderAuthError,
  maskedGoogleKeySuffix,
  parseVaultSecretId,
  peekResolvedGoogleSecret,
  sanitizeAiError,
  type ResolvedGoogleSecret,
} from "@/lib/ai/provider";
import { healthPingSchema } from "@/lib/ai/schemas";
import type { GenerationHealth, SecretHealth, SecretRefSummary } from "@/lib/ai/types";
import { writeAudit, type StaffClient } from "@/lib/cms/server";
import { createServiceSupabaseClient } from "@/lib/supabase/service";

const AUTH_FAILURE_DISABLE_AFTER = 3;

type SecretRow = {
  id: string;
  secret_ref: string;
  masked_suffix: string | null;
  health_status: string | null;
  priority: number | null;
  is_active: boolean | null;
  last_tested_at: string | null;
  last_error: string | null;
  consecutive_auth_failures?: number | null;
};

function secretClient(userClient: StaffClient, superAdmin: boolean): StaffClient {
  if (superAdmin) return userClient;
  try {
    return createServiceSupabaseClient();
  } catch {
    return userClient;
  }
}

function asSummary(row: SecretRow): SecretRefSummary {
  return {
    id: row.id,
    secretRef: row.secret_ref,
    kind: row.secret_ref.startsWith("vault:") ? "vault" : "env",
    maskedSuffix: String(row.masked_suffix ?? (row.secret_ref.startsWith("vault:") ? "vault" : "env")),
    health: (row.health_status as SecretHealth) ?? "unknown",
    priority: typeof row.priority === "number" ? row.priority : 0,
    isActive: row.is_active !== false,
    lastTestedAt: typeof row.last_tested_at === "string" ? row.last_tested_at : null,
    lastError: typeof row.last_error === "string" ? sanitizeAiError(row.last_error) : null,
  };
}

async function listGoogleSecretRows(client: StaffClient): Promise<SecretRow[]> {
  const { data, error } = await client
    .from("integration_secret_refs")
    .select("id, secret_ref, masked_suffix, health_status, priority, is_active, last_tested_at, last_error, consecutive_auth_failures")
    .eq("provider", GOOGLE_PROVIDER)
    .order("priority", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as SecretRow[];
}

async function readVaultSecret(id: string) {
  const service = createServiceSupabaseClient();
  const { data, error } = await service.rpc("read_provider_secret", { p_id: id });
  if (error) throw new Error(error.message);
  return typeof data === "string" ? data.trim() : "";
}

async function storeVaultSecret(name: string, secret: string) {
  const service = createServiceSupabaseClient();
  const { data, error } = await service.rpc("store_provider_secret", {
    p_name: name,
    p_secret: secret,
    p_description: "Google Generative AI API key",
  });
  if (error || typeof data !== "string") throw new Error(error?.message ?? "Vault write failed.");
  return data;
}

export async function resolveGoogleApiKey(client: StaffClient): Promise<ResolvedGoogleSecret | null> {
  let rows: SecretRow[] = [];
  try {
    rows = await listGoogleSecretRows(client);
  } catch {
    rows = [];
  }
  const candidates = rows
    .filter((row) => row.is_active !== false && row.health_status !== "disabled")
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

  for (const row of candidates) {
    const vaultId = parseVaultSecretId(row.secret_ref);
    if (vaultId) {
      try {
        const apiKey = await readVaultSecret(vaultId);
        if (!apiKey) continue;
        const secret = { apiKey, secretRef: row.secret_ref, maskedSuffix: maskedGoogleKeySuffix(apiKey) };
        cacheResolvedGoogleSecret(secret);
        return secret;
      } catch {
        continue;
      }
    }
    if (row.secret_ref === GOOGLE_SECRET_REF || row.secret_ref.startsWith("env:")) {
      const envName = row.secret_ref.startsWith("env:") ? row.secret_ref.slice(4) : GOOGLE_SECRET_ENV;
      const apiKey = process.env[envName]?.trim();
      if (!apiKey) continue;
      const secret = { apiKey, secretRef: row.secret_ref, maskedSuffix: maskedGoogleKeySuffix(apiKey) };
      cacheResolvedGoogleSecret(secret);
      return secret;
    }
  }

  const apiKey = process.env[GOOGLE_SECRET_ENV]?.trim();
  if (!apiKey) {
    cacheResolvedGoogleSecret(null);
    return null;
  }
  const secret = { apiKey, secretRef: GOOGLE_SECRET_REF, maskedSuffix: maskedGoogleKeySuffix(apiKey) };
  cacheResolvedGoogleSecret(secret);
  return secret;
}

export async function readGenerationHealth(client: StaffClient, role: string | null): Promise<GenerationHealth> {
  const superAdmin = canManageSecrets(role as StaffRole | null);
  const resolved = await resolveGoogleApiKey(secretClient(client, superAdmin));
  const configured = Boolean(resolved);
  let keys: SecretRefSummary[] = [];
  try {
    keys = (await listGoogleSecretRows(secretClient(client, superAdmin))).map(asSummary);
  } catch {
    keys = [];
  }
  const selected = keys.find((key) => key.secretRef === resolved?.secretRef) ?? keys.find((key) => key.isActive) ?? null;
  const health = selected?.health ?? (configured ? "unknown" : null);
  const disabled = !configured || selected?.health === "disabled";

  return {
    configured,
    health: superAdmin ? health : configured ? (health === "disabled" ? "disabled" : "unknown") : null,
    maskedSuffix: superAdmin ? resolved?.maskedSuffix ?? selected?.maskedSuffix ?? null : null,
    lastError: superAdmin ? selected?.lastError ?? null : null,
    lastTestedAt: superAdmin ? selected?.lastTestedAt ?? null : null,
    disabled: Boolean(disabled),
    source: resolved?.secretRef.startsWith("vault:") ? "vault" : resolved ? "env" : null,
    keys: superAdmin ? keys : [],
  };
}

async function patchSecretRef(client: StaffClient, superAdmin: boolean, secretRef: string, patch: Record<string, unknown>) {
  try {
    const writer = secretClient(client, superAdmin);
    await writer.from("integration_secret_refs").update(patch).eq("secret_ref", secretRef);
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
  const resolved = peekResolvedGoogleSecret() ?? (await resolveGoogleApiKey(secretClient(input.client, superAdmin)));
  const secretRef = resolved?.secretRef ?? GOOGLE_SECRET_REF;
  if (input.error && isProviderAuthError(input.error)) {
    const { data } = await secretClient(input.client, superAdmin)
      .from("integration_secret_refs")
      .select("consecutive_auth_failures")
      .eq("secret_ref", secretRef)
      .maybeSingle();
    const failures = (typeof data?.consecutive_auth_failures === "number" ? data.consecutive_auth_failures : 0) + 1;
    const disable = failures >= AUTH_FAILURE_DISABLE_AFTER;
    await patchSecretRef(input.client, superAdmin, secretRef, {
      health_status: disable ? "disabled" : "degraded",
      consecutive_auth_failures: failures,
      last_error: sanitizeAiError(input.error),
      last_tested_at: new Date().toISOString(),
      is_active: !disable,
    });
    if (disable) cacheResolvedGoogleSecret(null);
    return;
  }
  if (input.error) {
    await patchSecretRef(input.client, superAdmin, secretRef, {
      health_status: "degraded",
      last_error: sanitizeAiError(input.error),
      last_tested_at: new Date().toISOString(),
    });
    return;
  }
  await patchSecretRef(input.client, superAdmin, secretRef, {
    health_status: "healthy",
    consecutive_auth_failures: 0,
    last_error: null,
    last_tested_at: new Date().toISOString(),
    masked_suffix: resolved?.maskedSuffix ?? maskedGoogleKeySuffix(),
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
  const resolved = await resolveGoogleApiKey(input.client);
  if (!resolved) {
    return { ok: false as const, error: "No Google AI key is available from Vault or the server environment." };
  }
  try {
    const google = createGoogleProvider(resolved.apiKey);
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
      metadata: { secretRef: resolved.secretRef, result: "healthy" },
    });
    return { ok: true as const, message: `Google AI responded using ${resolved.secretRef.startsWith("vault:") ? "Vault" : "the server environment"}.` };
  } catch (error) {
    await recordProviderResult({ client: input.client, role: input.role, error });
    await writeAudit(input.client, {
      actorId: input.actorId,
      action: "ai.connection_test",
      entityType: "integration_secret_ref",
      metadata: { secretRef: resolved.secretRef, result: "failed" },
    });
    return { ok: false as const, error: sanitizeAiError(error) };
  }
}

function looksLikeGoogleKey(value: string) {
  const key = value.trim();
  return key.length >= 24 && key.length <= 256 && !/\s/.test(key);
}

export async function rotateGoogleApiKey(input: {
  client: StaffClient;
  role: string | null;
  actorId: string;
  apiKey: string;
}) {
  if (!canManageSecrets(input.role as StaffRole | null)) {
    return { ok: false as const, error: "Only a super admin can rotate the provider key." };
  }
  const apiKey = input.apiKey.trim();
  if (!looksLikeGoogleKey(apiKey)) {
    return { ok: false as const, error: "Paste a complete Google AI Studio key. It is stored in Vault and never shown again." };
  }
  try {
    const name = `google-ai-${randomUUID().replace(/-/g, "").slice(0, 12)}`;
    const vaultId = await storeVaultSecret(name, apiKey);
    const rows = await listGoogleSecretRows(input.client);
    const nextPriority = Math.max(0, ...rows.map((row) => row.priority ?? 0)) + 1;
    const secretRef = `vault:${vaultId}`;
    const { error } = await input.client.from("integration_secret_refs").insert({
      provider: GOOGLE_PROVIDER,
      secret_ref: secretRef,
      masked_suffix: maskedGoogleKeySuffix(apiKey),
      health_status: "unknown",
      priority: nextPriority,
      is_active: true,
      created_by: input.actorId,
    });
    if (error) throw new Error(error.message);
    cacheResolvedGoogleSecret({ apiKey, secretRef, maskedSuffix: maskedGoogleKeySuffix(apiKey) });
    await writeAudit(input.client, {
      actorId: input.actorId,
      action: "ai.key_rotate",
      entityType: "integration_secret_ref",
      metadata: { secretRef, priority: nextPriority },
    });
    return { ok: true as const, message: "New key stored in Vault. Previous keys stay available as failover." };
  } catch (error) {
    return { ok: false as const, error: sanitizeAiError(error) };
  }
}

export async function setGoogleSecretActive(input: {
  client: StaffClient;
  role: string | null;
  actorId: string;
  secretRef: string;
  active: boolean;
}) {
  if (!canManageSecrets(input.role as StaffRole | null)) {
    return { ok: false as const, error: "Only a super admin can change key activation." };
  }
  if (!input.secretRef.startsWith("env:") && !input.secretRef.startsWith("vault:")) {
    return { ok: false as const, error: "Unknown secret reference." };
  }
  const { error } = await input.client
    .from("integration_secret_refs")
    .update({ is_active: input.active, health_status: input.active ? "unknown" : "disabled" })
    .eq("secret_ref", input.secretRef)
    .eq("provider", GOOGLE_PROVIDER);
  if (error) return { ok: false as const, error: error.message };
  cacheResolvedGoogleSecret(null);
  await writeAudit(input.client, {
    actorId: input.actorId,
    action: input.active ? "ai.key_activate" : "ai.key_revoke",
    entityType: "integration_secret_ref",
    metadata: { secretRef: input.secretRef },
  });
  return { ok: true as const, message: input.active ? "Key activated." : "Key deactivated. It will not be used for new requests." };
}

export function cronSecretConfigured() {
  return Boolean(process.env.CRON_SECRET?.trim());
}

export { googleApiKeyConfigured };
