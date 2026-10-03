import "server-only";

import { createGoogle } from "@ai-sdk/google";

export const GOOGLE_SECRET_ENV = "GOOGLE_GENERATIVE_AI_API_KEY";
export const GOOGLE_SECRET_REF = `env:${GOOGLE_SECRET_ENV}`;

export function googleApiKeyConfigured() {
  return Boolean(process.env[GOOGLE_SECRET_ENV]?.trim());
}

export function maskedGoogleKeySuffix() {
  const key = process.env[GOOGLE_SECRET_ENV]?.trim() ?? "";
  if (key.length < 8) return "env";
  return key.slice(-4);
}

export function createGoogleProvider() {
  const apiKey = process.env[GOOGLE_SECRET_ENV]?.trim();
  if (!apiKey) {
    throw new Error("Google AI is not configured on the server.");
  }
  return createGoogle({ apiKey });
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
