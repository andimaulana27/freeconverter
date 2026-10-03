import "server-only";

import { createGoogle } from "@ai-sdk/google";

export const GOOGLE_SECRET_ENV = "GOOGLE_GENERATIVE_AI_API_KEY";
export const GOOGLE_SECRET_REF = `env:${GOOGLE_SECRET_ENV}`;
export const GOOGLE_PROVIDER = "google";

export type ResolvedGoogleSecret = {
  apiKey: string;
  secretRef: string;
  maskedSuffix: string;
};

let resolvedGoogleSecret: ResolvedGoogleSecret | null = null;

export function googleApiKeyConfigured() {
  return Boolean(resolvedGoogleSecret?.apiKey || process.env[GOOGLE_SECRET_ENV]?.trim());
}

export function maskedGoogleKeySuffix(apiKey = process.env[GOOGLE_SECRET_ENV]?.trim() ?? "") {
  if (apiKey.length < 8) return "env";
  return apiKey.slice(-4);
}

export function peekResolvedGoogleSecret() {
  return resolvedGoogleSecret;
}

export function cacheResolvedGoogleSecret(secret: ResolvedGoogleSecret | null) {
  resolvedGoogleSecret = secret;
}

export function createGoogleProvider(apiKey?: string) {
  const key = apiKey ?? resolvedGoogleSecret?.apiKey ?? process.env[GOOGLE_SECRET_ENV]?.trim();
  if (!key) {
    throw new Error("Google AI is not configured on the server.");
  }
  return createGoogle({ apiKey: key });
}

export function sanitizeAiError(error: unknown) {
  const raw = error instanceof Error ? error.message : String(error);
  return raw
    .replace(/AIza[\w-]{8,}/g, "[redacted]")
    .replace(/x-goog-api-key[:\s]+[^\s]+/gi, "x-goog-api-key [redacted]")
    .replace(new RegExp(`${GOOGLE_SECRET_ENV}=?\\S*`, "gi"), `${GOOGLE_SECRET_ENV} [redacted]`)
    .slice(0, 400);
}

export function isProviderAuthError(error: unknown) {
  const status =
    error && typeof error === "object" && "statusCode" in error ? Number((error as { statusCode?: unknown }).statusCode) : 0;
  if (status === 401 || status === 403) return true;
  return /api key|unauthenticated|permission.?denied|invalid.?api.?key|api_key_invalid/i.test(sanitizeAiError(error));
}

export function parseVaultSecretId(secretRef: string) {
  if (!secretRef.startsWith("vault:")) return null;
  const id = secretRef.slice("vault:".length);
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id) ? id : null;
}
