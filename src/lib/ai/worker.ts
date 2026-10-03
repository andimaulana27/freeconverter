import "server-only";

import { randomUUID } from "node:crypto";
import { isRetryableGenerationError, processArticleJob } from "@/lib/ai/article-job";
import { markEditorialSlot, planDailyBlog } from "@/lib/ai/daily-bot";
import { processMediaJob } from "@/lib/ai/media-job";
import { sanitizeAiError } from "@/lib/ai/provider";
import { recordProviderResult, resolveGoogleApiKey } from "@/lib/ai/secrets";
import {
  backoffIso,
  claimGenerationJobs,
  claimMediaJobs,
  fetchBatch,
  fetchJob,
  fetchMediaJob,
  fetchStaffRole,
  loadWorkerSettings,
  syncBatchProgress,
  updateJob,
  updateMediaJob,
} from "@/lib/ai/server";
import { createServiceSupabaseClient } from "@/lib/supabase/service";

export type WorkerTickResult = {
  articleClaimed: number;
  mediaClaimed: number;
  articleCompleted: number;
  mediaCompleted: number;
  failed: number;
};

async function failOrRetryArticle(client: ReturnType<typeof createServiceSupabaseClient>, jobId: string, error: unknown) {
  const job = await fetchJob(client, jobId);
  if (!job) return;
  const message = sanitizeAiError(error);
  const retry = isRetryableGenerationError(error) && job.attempts < job.max_attempts;
  if (job.cancel_requested) {
    await updateJob(client, jobId, { status: "cancelled", error: "Cancelled." });
    return;
  }
  await updateJob(client, jobId, {
    status: retry ? "pending" : "failed",
    error: message,
    next_attempt_at: retry ? backoffIso(job.attempts) : null,
  });
  if (!retry && !job.cancel_requested) {
    const batch = await fetchBatch(client, job.batch_id);
    if (batch?.progress.source === "daily_bot" && batch.progress.slotId) {
      await markEditorialSlot(client, batch.progress.slotId, {
        status: job.post_id ? "held" : "failed",
        error: message,
        ...(job.post_id ? { post_id: job.post_id } : {}),
      });
    }
  }
}

async function failOrRetryMedia(client: ReturnType<typeof createServiceSupabaseClient>, jobId: string, error: unknown) {
  const job = await fetchMediaJob(client, jobId);
  if (!job) return;
  const message = sanitizeAiError(error);
  const retry = isRetryableGenerationError(error) && job.attempts < job.max_attempts;
  if (job.cancel_requested) {
    await updateMediaJob(client, jobId, { status: "cancelled", error: "Cancelled." });
    return;
  }
  await updateMediaJob(client, jobId, {
    status: retry ? "pending" : "failed",
    error: message,
    next_attempt_at: retry ? backoffIso(job.attempts) : null,
  });
}

export async function processGenerationQueue(): Promise<WorkerTickResult> {
  const client = createServiceSupabaseClient();
  await resolveGoogleApiKey(client);
  const settings = await loadWorkerSettings(client);
  const workerId = `gen-${randomUUID().slice(0, 8)}`;
  const result: WorkerTickResult = {
    articleClaimed: 0,
    mediaClaimed: 0,
    articleCompleted: 0,
    mediaCompleted: 0,
    failed: 0,
  };

  const articles = await claimGenerationJobs(client, settings.articleConcurrency, workerId, settings.staleSeconds);
  const media = await claimMediaJobs(client, settings.mediaConcurrency, workerId, settings.staleSeconds);
  result.articleClaimed = articles.length;
  result.mediaClaimed = media.length;

  const touchedBatches = new Set<string>();

  const articleWork = articles.map(async (job) => {
    touchedBatches.add(job.batch_id);
    const batch = await fetchBatch(client, job.batch_id);
    const role = await fetchStaffRole(client, batch?.created_by ?? null);
    try {
      if (batch?.cancel_requested || job.cancel_requested) {
        await updateJob(client, job.id, { status: "cancelled", error: "Cancelled." });
        return;
      }
      await processArticleJob(client, job.id);
      await recordProviderResult({ client, role });
      result.articleCompleted += 1;
    } catch (error) {
      await recordProviderResult({ client, role, error });
      await failOrRetryArticle(client, job.id, error);
      result.failed += 1;
    }
  });

  const mediaWork = media.map(async (job) => {
    touchedBatches.add(job.batch_id);
    const batch = await fetchBatch(client, job.batch_id);
    const role = await fetchStaffRole(client, batch?.created_by ?? null);
    try {
      if (batch?.cancel_requested || job.cancel_requested) {
        await updateMediaJob(client, job.id, { status: "cancelled", error: "Cancelled." });
        return;
      }
      await processMediaJob(client, job.id);
      await recordProviderResult({ client, role });
      result.mediaCompleted += 1;
    } catch (error) {
      await recordProviderResult({ client, role, error });
      await failOrRetryMedia(client, job.id, error);
      result.failed += 1;
    }
  });

  await Promise.allSettled([...articleWork, ...mediaWork]);
  await Promise.all([...touchedBatches].map((batchId) => syncBatchProgress(client, batchId)));
  return result;
}

export async function kickGenerationWorker() {
  let dailyQueued = 0;
  try {
    const client = createServiceSupabaseClient();
    dailyQueued = (await planDailyBlog(client)).queued;
  } catch (error) {
    console.error("daily blog bot", sanitizeAiError(error));
  }
  try {
    const result = await processGenerationQueue();
    return { ...result, dailyQueued };
  } catch (error) {
    console.error("generation worker", sanitizeAiError(error));
    return {
      articleClaimed: 0,
      mediaClaimed: 0,
      articleCompleted: 0,
      mediaCompleted: 0,
      failed: 0,
      dailyQueued,
    };
  }
}
