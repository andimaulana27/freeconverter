"use server";

import { after } from "next/server";
import { canManageSecrets, canPublish } from "@/lib/auth/roles";
import { requireCms, requireStaff } from "@/lib/auth/session";
import {
  cancelGenerationBatch,
  createTitleBatch,
  enforceGenerationBudget,
  enqueueSelectedArticles,
  retryGenerationJob,
  retryMediaJob,
  saveTitleSelections,
} from "@/lib/ai/pipeline";
import { assertGenerationAvailable, readGenerationHealth, testGoogleConnection } from "@/lib/ai/secrets";
import { fetchBatch } from "@/lib/ai/server";
import { kickGenerationWorker } from "@/lib/ai/worker";
import { ARTICLE_TYPES, type ArticleType, type GenerationActionResult, type PublishingMode, type TitleCandidate } from "@/lib/ai/types";
import { filterKnownToolSlugs } from "@/lib/ai/validate";
import { sanitizeAiError } from "@/lib/ai/provider";

function asArticleType(value: string): ArticleType {
  return ARTICLE_TYPES.includes(value as ArticleType) ? (value as ArticleType) : "tool_tutorial";
}

function asPublishingMode(value: string | undefined, publisher: boolean): PublishingMode {
  if (!publisher) return "draft";
  if (value === "scheduled" || value === "auto") return value;
  return "draft";
}

function kickWorker() {
  after(() => {
    void kickGenerationWorker();
  });
}

export async function createTitleBatchAction(input: {
  topic: string;
  articleType: string;
  direction: string;
  audience: string;
  language: string;
  tone: string;
  titleCount: number;
  targetToolSlugs: string[];
  includeIllustration: boolean;
}): Promise<GenerationActionResult> {
  const session = await requireCms("/admin/generate");
  const available = await assertGenerationAvailable(session.supabase, session.role);
  if (!available.ok) return available;
  const budget = await enforceGenerationBudget(session.supabase, session.user.id, 0);
  if (!budget.ok) return budget;
  try {
    const result = await createTitleBatch({
      client: session.supabase,
      role: session.role,
      actorId: session.user.id,
      topic: input.topic,
      articleType: asArticleType(input.articleType),
      direction: input.direction,
      audience: input.audience,
      language: input.language,
      tone: input.tone,
      titleCount: input.titleCount,
      targetToolSlugs: filterKnownToolSlugs(input.targetToolSlugs),
      includeIllustration: input.includeIllustration,
    });
    return result;
  } catch (error) {
    return { ok: false, error: sanitizeAiError(error) };
  }
}

export async function saveTitlesAction(input: {
  batchId: string;
  titles: TitleCandidate[];
  selectedIndexes: number[];
  includeIllustration: boolean;
  publishingMode?: PublishingMode;
}): Promise<GenerationActionResult> {
  const session = await requireCms(`/admin/generate/${input.batchId}`);
  const batch = await fetchBatch(session.supabase, input.batchId);
  if (!batch) return { ok: false, error: "Batch not found." };
  await saveTitleSelections({
    client: session.supabase,
    batchId: input.batchId,
    titles: input.titles,
    selectedIndexes: input.selectedIndexes,
    includeIllustration: input.includeIllustration,
    publishingMode: asPublishingMode(input.publishingMode, canPublish(session.role)),
  });
  return { ok: true, batchId: input.batchId };
}

export async function enqueueArticlesAction(input: {
  batchId: string;
  selectedIndexes: number[];
  titles: TitleCandidate[];
  includeIllustration: boolean;
  publishingMode?: PublishingMode;
}): Promise<GenerationActionResult> {
  const session = await requireCms(`/admin/generate/${input.batchId}`);
  const available = await assertGenerationAvailable(session.supabase, session.role);
  if (!available.ok) return available;
  const count = [...new Set(input.selectedIndexes)].length;
  const budget = await enforceGenerationBudget(session.supabase, session.user.id, count);
  if (!budget.ok) return budget;
  try {
    const result = await enqueueSelectedArticles({
      client: session.supabase,
      role: session.role,
      actorId: session.user.id,
      batchId: input.batchId,
      selectedIndexes: input.selectedIndexes,
      titles: input.titles,
      includeIllustration: input.includeIllustration,
      publishingMode: asPublishingMode(input.publishingMode, canPublish(session.role)),
    });
    kickWorker();
    return result;
  } catch (error) {
    return { ok: false, error: sanitizeAiError(error) };
  }
}

export async function cancelBatchAction(input: { batchId: string }): Promise<GenerationActionResult> {
  const session = await requireCms(`/admin/generate/${input.batchId}`);
  try {
    return await cancelGenerationBatch({
      client: session.supabase,
      actorId: session.user.id,
      batchId: input.batchId,
    });
  } catch (error) {
    return { ok: false, error: sanitizeAiError(error) };
  }
}

export async function retryJobAction(input: { jobId: string; batchId: string }): Promise<GenerationActionResult> {
  const session = await requireCms(`/admin/generate/${input.batchId}`);
  const available = await assertGenerationAvailable(session.supabase, session.role);
  if (!available.ok) return available;
  try {
    const result = await retryGenerationJob({
      client: session.supabase,
      actorId: session.user.id,
      jobId: input.jobId,
    });
    kickWorker();
    return result;
  } catch (error) {
    return { ok: false, error: sanitizeAiError(error) };
  }
}

export async function retryMediaJobAction(input: { mediaJobId: string; batchId: string }): Promise<GenerationActionResult> {
  const session = await requireCms(`/admin/generate/${input.batchId}`);
  const available = await assertGenerationAvailable(session.supabase, session.role);
  if (!available.ok) return available;
  try {
    const result = await retryMediaJob({
      client: session.supabase,
      actorId: session.user.id,
      mediaJobId: input.mediaJobId,
    });
    kickWorker();
    return result;
  } catch (error) {
    return { ok: false, error: sanitizeAiError(error) };
  }
}

export async function kickGenerationWorkerAction(): Promise<GenerationActionResult> {
  await requireCms("/admin/generate");
  kickWorker();
  return { ok: true, message: "Worker started." };
}

export async function testGoogleConnectionAction(): Promise<GenerationActionResult> {
  const session = await requireStaff("/admin/generate");
  if (!canManageSecrets(session.role)) return { ok: false, error: "Only a super admin can test the provider key.", code: "forbidden" };
  const result = await testGoogleConnection({
    client: session.supabase,
    role: session.role,
    actorId: session.user.id,
  });
  if (!result.ok) return result;
  const health = await readGenerationHealth(session.supabase, session.role);
  return { ok: true, message: result.message, health };
}
