import "server-only";

import { createHash } from "node:crypto";
import type { VisualBrief } from "@/lib/ai/types";
import { canPublish, type StaffRole } from "@/lib/auth/roles";
import { brandedCoverSvg, illustrationDataUri } from "@/lib/cms/cover-template";
import { upsertPublicCover, type StaffClient } from "@/lib/cms/server";

export async function applyCover(input: {
  client: StaffClient;
  postId: string;
  title: string;
  kicker: string;
  actorId: string;
  role: StaffRole;
  brief: VisualBrief;
  illustration?: { bytes: Uint8Array; mediaType: string; modelId: string; prompt: string } | null;
}) {
  const dataUri = input.illustration
    ? illustrationDataUri(input.illustration.bytes, input.illustration.mediaType)
    : null;
  const svg = brandedCoverSvg(input.title, input.kicker, {
    ...input.brief,
    illustrationDataUri: dataUri,
  });
  const body = new Blob([svg], { type: "image/svg+xml" });
  const promptHash = input.illustration
    ? createHash("sha256").update(input.illustration.prompt).digest("hex").slice(0, 32)
    : null;
  return upsertPublicCover(input.client, {
    postId: input.postId,
    path: `covers/${input.postId}/template.svg`,
    body,
    contentType: "image/svg+xml",
    altText: input.brief.altText || `Branded cover for ${input.title}`,
    actorId: input.actorId,
    source: input.illustration && dataUri ? "ai" : "template",
    approve: canPublish(input.role),
    templateKey: input.brief.templateKey,
    variant: `${input.brief.palette}:${input.brief.motif}:hero`,
    seed: input.postId,
    provider: input.illustration ? "google" : null,
    modelId: input.illustration?.modelId ?? null,
    promptHash,
    width: 1200,
    height: 630,
  });
}

export function estimateTokenUsd(totalTokens: number) {
  return Math.round((totalTokens / 1_000_000) * 0.5 * 10_000) / 10_000;
}
