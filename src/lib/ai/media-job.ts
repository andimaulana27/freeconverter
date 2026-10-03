import "server-only";

import { createHash } from "node:crypto";
import { applyCover, estimateTokenUsd } from "@/lib/ai/cover";
import { generateIllustrationPng } from "@/lib/ai/generate";
import {
  fetchBatch,
  fetchMediaJob,
  fetchStaffRole,
  loadModelProfile,
  updateMediaJob,
} from "@/lib/ai/server";
import type { GenerationTrace, VisualBrief } from "@/lib/ai/types";
import { fallbackVisualBrief } from "@/lib/ai/validate";
import { isStaffRole, type StaffRole } from "@/lib/auth/roles";
import { fetchPost, writeAudit, type StaffClient } from "@/lib/cms/server";

const MAX_ILLUSTRATION_BYTES = 1_400_000;

function asVisualBrief(value: unknown, title: string, kicker: string): VisualBrief {
  const fallback = fallbackVisualBrief(title, kicker);
  if (!value || typeof value !== "object") return fallback;
  const raw = value as Record<string, unknown>;
  const titleLines = Array.isArray(raw.titleLines)
    ? raw.titleLines.filter((item): item is string => typeof item === "string").slice(0, 4)
    : fallback.titleLines;
  return {
    templateKey:
      raw.templateKey === "split-band" || raw.templateKey === "quiet-grid" || raw.templateKey === "brand-bar"
        ? raw.templateKey
        : fallback.templateKey,
    palette: raw.palette === "ink" || raw.palette === "bone" || raw.palette === "paper" ? raw.palette : fallback.palette,
    motif: raw.motif === "corner" || raw.motif === "grid" || raw.motif === "rule" ? raw.motif : fallback.motif,
    kicker: typeof raw.kicker === "string" && raw.kicker.trim() ? raw.kicker.slice(0, 32) : fallback.kicker,
    titleLines: titleLines.length ? titleLines : fallback.titleLines,
    altText: typeof raw.altText === "string" && raw.altText.trim().length >= 12 ? raw.altText.slice(0, 160) : fallback.altText,
    illustrationPrompt:
      typeof raw.illustrationPrompt === "string" && raw.illustrationPrompt.length >= 20
        ? raw.illustrationPrompt
        : fallback.illustrationPrompt,
  };
}

function moderateImage(bytes: Uint8Array, mediaType: string) {
  const checks: string[] = [];
  if (!bytes.byteLength) checks.push("empty");
  if (bytes.byteLength > MAX_ILLUSTRATION_BYTES) checks.push("too_large");
  if (!mediaType.startsWith("image/")) checks.push("not_image");
  if (mediaType.includes("svg")) checks.push("svg_not_allowed");
  return { passed: checks.length === 0, checks, bytes: bytes.byteLength, mediaType };
}

export async function processMediaJob(client: StaffClient, jobId: string) {
  const job = await fetchMediaJob(client, jobId);
  if (!job) throw new Error("Media job not found.");
  const batch = await fetchBatch(client, job.batch_id);
  if (!batch) throw new Error("Batch not found.");
  if (job.cancel_requested || batch.cancel_requested) {
    await updateMediaJob(client, jobId, { status: "cancelled", error: "Cancelled." });
    return { ok: true as const, cancelled: true };
  }
  if (job.status === "completed" && job.media_asset_id) {
    return { ok: true as const, mediaAssetId: job.media_asset_id };
  }
  if (!job.post_id) throw new Error("Media job is missing a post.");

  const actorId = batch.created_by;
  if (!actorId) throw new Error("Batch is missing an owner.");
  const roleValue = await fetchStaffRole(client, actorId);
  const role: StaffRole = isStaffRole(roleValue) ? roleValue : "author";
  const post = await fetchPost(client, job.post_id);
  if (!post) throw new Error("Guide not found for media job.");

  const title = typeof job.payload.title === "string" ? job.payload.title : post.title;
  const kicker = typeof job.payload.kicker === "string" ? job.payload.kicker : post.topic?.name || "GUIDE";
  const brief = asVisualBrief(job.payload.visualBrief, title, kicker);
  const prompt = brief.illustrationPrompt;
  const promptHash = createHash("sha256").update(prompt).digest("hex").slice(0, 32);

  if (post.cover?.prompt_hash === promptHash && post.cover.source === "ai" && post.cover.generation_status === "ready") {
    await updateMediaJob(client, jobId, {
      status: "completed",
      media_asset_id: post.cover_asset_id,
      moderation: { passed: true, skipped: "idempotent" },
      error: null,
    });
    return { ok: true as const, mediaAssetId: post.cover_asset_id };
  }

  await updateMediaJob(client, jobId, { status: "running" });
  const imageProfile = await loadModelProfile(client, "cover_illustration");
  let trace: GenerationTrace = job.token_usage?.steps?.length ? job.token_usage : { steps: [], promptVersions: {} };
  const image = await generateIllustrationPng({ profile: imageProfile, prompt });
  trace = {
    steps: [...trace.steps, image.step],
    promptVersions: { ...trace.promptVersions, [image.step.task]: image.step.promptVersion ?? 0 },
  };

  const moderation = moderateImage(image.bytes, image.mediaType);
  if (!moderation.passed) {
    await updateMediaJob(client, jobId, {
      moderation,
      token_usage: trace,
      prompt_hash: promptHash,
    });
    throw new Error(`Illustration rejected: ${moderation.checks.join(", ")}.`);
  }

  const mediaId = await applyCover({
    client,
    postId: post.id,
    title,
    kicker,
    actorId,
    role,
    brief,
    illustration: {
      bytes: image.bytes,
      mediaType: image.mediaType,
      modelId: imageProfile.model_id,
      prompt,
    },
  });

  await updateMediaJob(client, jobId, {
    status: "completed",
    media_asset_id: mediaId,
    seed: post.id,
    prompt_hash: promptHash,
    moderation,
    token_usage: trace,
    cost_estimate_usd: estimateTokenUsd(image.step.totalTokens) + 0.04,
    error: null,
  });
  await writeAudit(client, {
    actorId,
    action: "generation.media",
    entityType: "generation_media_job",
    entityId: jobId,
    metadata: { postId: post.id, mediaAssetId: mediaId, modelId: imageProfile.model_id, promptHash },
  });
  return { ok: true as const, mediaAssetId: mediaId };
}
