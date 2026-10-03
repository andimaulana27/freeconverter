import "server-only";

import { compactCatalog, productGrounding, toolFacts } from "@/lib/ai/catalog";
import { applyCover } from "@/lib/ai/cover";
import { generateIllustrationPng, generateStructured } from "@/lib/ai/generate";
import { titleBatchSchema } from "@/lib/ai/schemas";
import { sanitizeAiError } from "@/lib/ai/provider";
import {
  countRecentJobs,
  fetchBatch,
  fetchJob,
  fetchMediaJob,
  hourlyJobLimit,
  insertBatch,
  insertJob,
  listExistingGuideSignals,
  listJobsForBatch,
  listMediaJobsForBatch,
  loadModelProfile,
  loadWorkerSettings,
  syncBatchProgress,
  updateBatch,
  updateJob,
  updateMediaJob,
} from "@/lib/ai/server";
import { recordProviderResult } from "@/lib/ai/secrets";
import type { ArticleType, BatchProgress, PublishingMode, TitleCandidate } from "@/lib/ai/types";
import { fallbackVisualBrief, filterKnownToolSlugs } from "@/lib/ai/validate";
import type { StaffRole } from "@/lib/auth/roles";
import { fetchPost, writeAudit, type StaffClient } from "@/lib/cms/server";
import { slugify } from "@/lib/cms/slug";

export async function enforceGenerationBudget(client: StaffClient, userId: string, extraJobs = 1) {
  const [usage, limit] = await Promise.all([countRecentJobs(client, userId), hourlyJobLimit(client)]);
  if (usage.jobs + extraJobs > limit || usage.batches >= 12) {
    return { ok: false as const, error: `Hourly generation limit reached (${limit} jobs).`, code: "rate_limited" as const };
  }
  return { ok: true as const };
}

export async function createTitleBatch(input: {
  client: StaffClient;
  role: StaffRole;
  actorId: string;
  topic: string;
  articleType: ArticleType;
  direction: string;
  audience: string;
  language: string;
  tone: string;
  titleCount: number;
  targetToolSlugs: string[];
  includeIllustration: boolean;
}) {
  const count = Math.min(15, Math.max(5, Math.round(input.titleCount) || 8));
  const tools = filterKnownToolSlugs(input.targetToolSlugs);
  const existing = await listExistingGuideSignals(input.client);
  const profile = await loadModelProfile(input.client, "title_ideation");
  const progress: BatchProgress = {
    direction: input.direction.trim(),
    audience: input.audience.trim() || "people who need to convert or fix a file",
    language: input.language.trim() || "en",
    tone: input.tone.trim() || "clear and practical",
    targetToolSlugs: tools,
    includeIllustration: input.includeIllustration,
    titles: [],
  };

  const batch = await insertBatch(input.client, {
    topic: input.topic.trim() || input.articleType.replaceAll("_", " "),
    articleType: input.articleType,
    requestedCount: 1,
    actorId: input.actorId,
    progress,
  });

  try {
    const { output, step } = await generateStructured({
      profile,
      schema: titleBatchSchema,
      name: "TitleBatch",
      extraSystem: productGrounding(),
      prompt: JSON.stringify(
        {
          articleType: input.articleType,
          topic: batch.topic,
          direction: progress.direction,
          audience: progress.audience,
          language: progress.language,
          tone: progress.tone,
          requestedTitles: count,
          focusTools: toolFacts(tools),
          catalog: compactCatalog(),
          existingGuides: existing.slice(0, 40),
        },
        null,
        2,
      ),
    });
    await recordProviderResult({ client: input.client, role: input.role });

    const titles: TitleCandidate[] = output.titles.map((item) => ({
      title: item.title.trim(),
      slugSuggestion: slugify(item.slugSuggestion || item.title),
      searchIntent: item.searchIntent.trim(),
      articleType: item.articleType,
      targetToolSlugs: filterKnownToolSlugs(item.targetToolSlugs.length ? item.targetToolSlugs : tools),
      rationale: item.rationale.trim(),
      rejected: false,
    }));

    await updateBatch(input.client, batch.id, {
      status: "pending",
      progress: { ...progress, titles },
    });
    await writeAudit(input.client, {
      actorId: input.actorId,
      action: "generation.titles",
      entityType: "generation_batch",
      entityId: batch.id,
      metadata: { count: titles.length, modelId: step.modelId, promptVersion: step.promptVersion },
    });
    return { ok: true as const, batchId: batch.id };
  } catch (error) {
    await recordProviderResult({ client: input.client, role: input.role, error });
    await updateBatch(input.client, batch.id, { status: "failed" });
    throw new Error(sanitizeAiError(error));
  }
}

export async function saveTitleSelections(input: {
  client: StaffClient;
  batchId: string;
  titles: TitleCandidate[];
  selectedIndexes: number[];
  includeIllustration: boolean;
  publishingMode?: PublishingMode;
}) {
  const batch = await fetchBatch(input.client, input.batchId);
  if (!batch) throw new Error("Batch not found.");
  await updateBatch(input.client, batch.id, {
    publishing_mode: input.publishingMode ?? batch.publishing_mode,
    progress: {
      ...batch.progress,
      titles: input.titles,
      selectedIndexes: input.selectedIndexes,
      selectedIndex: input.selectedIndexes[0],
      includeIllustration: input.includeIllustration,
    },
  });
}

export async function enqueueSelectedArticles(input: {
  client: StaffClient;
  role: StaffRole;
  actorId: string;
  batchId: string;
  selectedIndexes: number[];
  titles: TitleCandidate[];
  includeIllustration: boolean;
  publishingMode?: PublishingMode;
}) {
  const uniqueIndexes = [...new Set(input.selectedIndexes)].filter((index) => index >= 0);
  if (!uniqueIndexes.length) throw new Error("Select at least one title.");
  if (uniqueIndexes.length > 15) throw new Error("A batch can include at most 15 articles.");

  const batch = await fetchBatch(input.client, input.batchId);
  if (!batch) throw new Error("Batch not found.");
  if (batch.cancel_requested) throw new Error("This batch was cancelled.");

  uniqueIndexes.forEach((index) => {
    const title = input.titles[index];
    if (!title || title.rejected) throw new Error("Every selected title must still be active.");
    if (!title.title.trim()) throw new Error("Selected titles cannot be empty.");
  });

  const settings = await loadWorkerSettings(input.client);
  const mode: PublishingMode = input.role === "author" ? "draft" : input.publishingMode ?? batch.publishing_mode;
  if (mode === "auto" && !settings.autoPublishEnabled) {
    throw new Error("Automatic publishing is turned off until reviewed batches pass quality checks.");
  }

  await saveTitleSelections({
    client: input.client,
    batchId: batch.id,
    titles: input.titles,
    selectedIndexes: uniqueIndexes,
    includeIllustration: input.includeIllustration,
    publishingMode: mode,
  });

  const jobs = [];
  for (const index of uniqueIndexes) {
    const title = input.titles[index];
    const slugKey = slugify(title.slugSuggestion || title.title);
    const job = await insertJob(input.client, {
      batchId: batch.id,
      title: title.title,
      idempotencyKey: `${batch.id}:${slugKey}`,
      maxAttempts: settings.maxAttempts,
    }).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      if (!/duplicate|unique/i.test(message)) throw error;
      return null;
    });
    if (job) jobs.push(job);
  }

  const existing = await listJobsForBatch(input.client, batch.id);
  if (!jobs.length && !existing.length) throw new Error("Could not queue any drafts.");

  await updateBatch(input.client, batch.id, {
    status: "running",
    requested_count: Math.min(15, Math.max(1, existing.length || jobs.length)),
    publishing_mode: mode,
    cancel_requested: false,
  });
  await syncBatchProgress(input.client, batch.id);
  await writeAudit(input.client, {
    actorId: input.actorId,
    action: "generation.enqueue",
    entityType: "generation_batch",
    entityId: batch.id,
    metadata: { queued: jobs.length, publishingMode: mode, includeIllustration: input.includeIllustration },
  });
  return {
    ok: true as const,
    batchId: batch.id,
    queued: jobs.length,
    message: `Queued ${existing.length} draft${existing.length === 1 ? "" : "s"}. You can leave this page.`,
  };
}

export async function cancelGenerationBatch(input: { client: StaffClient; actorId: string; batchId: string }) {
  const batch = await fetchBatch(input.client, input.batchId);
  if (!batch) throw new Error("Batch not found.");
  await updateBatch(input.client, batch.id, { cancel_requested: true });
  const jobs = await listJobsForBatch(input.client, batch.id);
  const media = await listMediaJobsForBatch(input.client, batch.id);
  await Promise.all([
    ...jobs
      .filter((job) => job.status === "pending" || job.status === "running")
      .map((job) =>
        updateJob(input.client, job.id, {
          cancel_requested: true,
          status: job.status === "pending" ? "cancelled" : job.status,
          error: job.status === "pending" ? "Cancelled." : job.error,
          heartbeat: false,
        }),
      ),
    ...media
      .filter((job) => job.status === "pending" || job.status === "running")
      .map((job) =>
        updateMediaJob(input.client, job.id, {
          cancel_requested: true,
          status: job.status === "pending" ? "cancelled" : job.status,
          error: job.status === "pending" ? "Cancelled." : job.error,
          heartbeat: false,
        }),
      ),
  ]);
  await syncBatchProgress(input.client, batch.id);
  await writeAudit(input.client, {
    actorId: input.actorId,
    action: "generation.cancel",
    entityType: "generation_batch",
    entityId: batch.id,
  });
  return { ok: true as const, batchId: batch.id, message: "Cancellation requested. Running steps stop at the next checkpoint." };
}

export async function retryGenerationJob(input: { client: StaffClient; actorId: string; jobId: string }) {
  const job = await fetchJob(input.client, input.jobId);
  if (!job) throw new Error("Job not found.");
  if (job.status === "completed") return { ok: true as const, batchId: job.batch_id, jobId: job.id, message: "This draft is already saved." };
  const batch = await fetchBatch(input.client, job.batch_id);
  if (!batch) throw new Error("Batch not found.");
  if (batch.cancel_requested) throw new Error("This batch was cancelled.");
  await updateJob(input.client, job.id, {
    status: "pending",
    cancel_requested: false,
    error: null,
    next_attempt_at: new Date().toISOString(),
    attempts: 0,
  });
  await updateBatch(input.client, batch.id, { status: "running", cancel_requested: false });
  await syncBatchProgress(input.client, batch.id);
  await writeAudit(input.client, {
    actorId: input.actorId,
    action: "generation.retry",
    entityType: "generation_job",
    entityId: job.id,
  });
  return { ok: true as const, batchId: batch.id, jobId: job.id, message: "Retry queued." };
}

export async function retryMediaJob(input: { client: StaffClient; actorId: string; mediaJobId: string }) {
  const job = await fetchMediaJob(input.client, input.mediaJobId);
  if (!job) throw new Error("Media job not found.");
  if (job.status === "completed") return { ok: true as const, batchId: job.batch_id, message: "This illustration is already ready." };
  await updateMediaJob(input.client, job.id, {
    status: "pending",
    cancel_requested: false,
    error: null,
    next_attempt_at: new Date().toISOString(),
    attempts: 0,
  });
  await updateBatch(input.client, job.batch_id, { status: "running", cancel_requested: false });
  await syncBatchProgress(input.client, job.batch_id);
  await writeAudit(input.client, {
    actorId: input.actorId,
    action: "generation.media_retry",
    entityType: "generation_media_job",
    entityId: job.id,
  });
  return { ok: true as const, batchId: job.batch_id, message: "Illustration retry queued." };
}

export async function generateAiCoverForPost(input: {
  client: StaffClient;
  role: StaffRole;
  actorId: string;
  postId: string;
  title: string;
  kicker?: string;
}) {
  const post = await fetchPost(input.client, input.postId);
  if (!post) throw new Error("Guide not found.");
  const brief = fallbackVisualBrief(input.title || post.title, input.kicker || post.topic?.name || "GUIDE", post.id);
  const imageProfile = await loadModelProfile(input.client, "cover_illustration");
  try {
    const image = await generateIllustrationPng({
      profile: imageProfile,
      prompt: brief.illustrationPrompt,
    });
    await recordProviderResult({ client: input.client, role: input.role });
    await applyCover({
      client: input.client,
      postId: post.id,
      title: input.title || post.title,
      kicker: brief.kicker,
      actorId: input.actorId,
      role: input.role,
      brief,
      illustration: {
        bytes: image.bytes,
        mediaType: image.mediaType,
        modelId: imageProfile.model_id,
        prompt: brief.illustrationPrompt,
      },
    });
    await writeAudit(input.client, {
      actorId: input.actorId,
      action: "post.cover_ai",
      entityType: "blog_post",
      entityId: post.id,
      metadata: { modelId: imageProfile.model_id },
    });
  } catch (error) {
    await recordProviderResult({ client: input.client, role: input.role, error });
    throw new Error(sanitizeAiError(error));
  }
  return fetchPost(input.client, post.id);
}
