import "server-only";

import {
  ARTICLE_TYPES,
  GENERATION_BATCH_STATUSES,
  GENERATION_JOB_STAGES,
  GENERATION_JOB_STATUSES,
  type AiModelProfile,
  type ArticleType,
  type BatchProgress,
  type GenerationBatch,
  type GenerationBatchStatus,
  type GenerationJob,
  type GenerationJobStage,
  type GenerationJobStatus,
  type GenerationTrace,
  type TitleCandidate,
} from "@/lib/ai/types";
import { slugify } from "@/lib/cms/slug";
import type { StaffClient } from "@/lib/cms/server";

function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function asArticleType(value: unknown): ArticleType {
  return ARTICLE_TYPES.includes(value as ArticleType) ? (value as ArticleType) : "tool_tutorial";
}

function asBatchStatus(value: unknown): GenerationBatchStatus {
  return GENERATION_BATCH_STATUSES.includes(value as GenerationBatchStatus) ? (value as GenerationBatchStatus) : "pending";
}

function asJobStatus(value: unknown): GenerationJobStatus {
  return GENERATION_JOB_STATUSES.includes(value as GenerationJobStatus) ? (value as GenerationJobStatus) : "pending";
}

function asJobStage(value: unknown): GenerationJobStage {
  return GENERATION_JOB_STAGES.includes(value as GenerationJobStage) ? (value as GenerationJobStage) : "queued";
}

export function parseProgress(value: unknown): BatchProgress {
  if (!value || typeof value !== "object") return {};
  const raw = value as Record<string, unknown>;
  const titles = Array.isArray(raw.titles)
    ? raw.titles.flatMap((item): TitleCandidate[] => {
        if (!item || typeof item !== "object") return [];
        const row = item as Record<string, unknown>;
        const title = typeof row.title === "string" ? row.title.trim() : "";
        if (!title) return [];
        return [
          {
            title,
            slugSuggestion: slugify(typeof row.slugSuggestion === "string" ? row.slugSuggestion : title),
            searchIntent: typeof row.searchIntent === "string" ? row.searchIntent : "",
            articleType: asArticleType(row.articleType),
            targetToolSlugs: Array.isArray(row.targetToolSlugs)
              ? row.targetToolSlugs.filter((slug): slug is string => typeof slug === "string")
              : [],
            rationale: typeof row.rationale === "string" ? row.rationale : "",
            rejected: row.rejected === true,
          },
        ];
      })
    : [];
  return {
    direction: typeof raw.direction === "string" ? raw.direction : "",
    audience: typeof raw.audience === "string" ? raw.audience : "search users converting files",
    language: typeof raw.language === "string" ? raw.language : "en",
    tone: typeof raw.tone === "string" ? raw.tone : "clear and practical",
    targetToolSlugs: Array.isArray(raw.targetToolSlugs)
      ? raw.targetToolSlugs.filter((slug): slug is string => typeof slug === "string")
      : [],
    includeIllustration: raw.includeIllustration === true,
    titles,
    selectedIndex: typeof raw.selectedIndex === "number" ? raw.selectedIndex : undefined,
  };
}

function asTrace(value: unknown): GenerationTrace {
  if (!value || typeof value !== "object") return { steps: [], promptVersions: {} };
  const raw = value as Record<string, unknown>;
  const steps = Array.isArray(raw.steps)
    ? raw.steps.flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const row = item as Record<string, unknown>;
        return [
          {
            task: String(row.task ?? ""),
            modelId: String(row.modelId ?? ""),
            promptVersion: typeof row.promptVersion === "number" ? row.promptVersion : null,
            inputTokens: typeof row.inputTokens === "number" ? row.inputTokens : 0,
            outputTokens: typeof row.outputTokens === "number" ? row.outputTokens : 0,
            totalTokens: typeof row.totalTokens === "number" ? row.totalTokens : 0,
          },
        ];
      })
    : [];
  const promptVersions =
    raw.promptVersions && typeof raw.promptVersions === "object" ? (raw.promptVersions as Record<string, number>) : {};
  return { steps, promptVersions };
}

function asBatch(row: Record<string, unknown>): GenerationBatch {
  return {
    id: String(row.id),
    topic: String(row.topic ?? ""),
    article_type: asArticleType(row.article_type),
    requested_count: typeof row.requested_count === "number" ? row.requested_count : 1,
    publishing_mode: row.publishing_mode === "scheduled" || row.publishing_mode === "auto" ? row.publishing_mode : "draft",
    status: asBatchStatus(row.status),
    progress: parseProgress(row.progress),
    created_by: typeof row.created_by === "string" ? row.created_by : null,
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
  };
}

function asJob(row: Record<string, unknown>): GenerationJob {
  return {
    id: String(row.id),
    batch_id: String(row.batch_id),
    title: typeof row.title === "string" ? row.title : null,
    outline: row.outline && typeof row.outline === "object" ? (row.outline as Record<string, unknown>) : null,
    draft: row.draft && typeof row.draft === "object" ? (row.draft as Record<string, unknown>) : null,
    validation: row.validation && typeof row.validation === "object" ? (row.validation as Record<string, unknown>) : null,
    stage: asJobStage(row.stage),
    status: asJobStatus(row.status),
    attempts: typeof row.attempts === "number" ? row.attempts : 0,
    error: typeof row.error === "string" ? row.error : null,
    token_usage: asTrace(row.token_usage),
    post_id: typeof row.post_id === "string" ? row.post_id : null,
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
  };
}

export async function loadModelProfile(client: StaffClient, taskKey: string): Promise<AiModelProfile> {
  const { data, error } = await client
    .from("ai_model_profiles")
    .select(
      "id, task_key, provider, model_id, prompt_template_id, temperature, thinking_level, max_output_tokens, is_active, prompt:prompt_templates ( version, system_prompt, task_prompt, is_active )",
    )
    .eq("task_key", taskKey)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error(`No active model profile for ${taskKey}.`);
  const prompt = one(data.prompt as { version?: number; system_prompt?: string; task_prompt?: string } | { version?: number; system_prompt?: string; task_prompt?: string }[] | null);
  return {
    id: String(data.id),
    task_key: String(data.task_key),
    provider: String(data.provider ?? "google"),
    model_id: String(data.model_id),
    prompt_template_id: typeof data.prompt_template_id === "string" ? data.prompt_template_id : null,
    temperature: typeof data.temperature === "number" ? data.temperature : data.temperature == null ? null : Number(data.temperature),
    thinking_level: typeof data.thinking_level === "string" ? data.thinking_level : null,
    max_output_tokens: typeof data.max_output_tokens === "number" ? data.max_output_tokens : null,
    is_active: data.is_active !== false,
    system_prompt: prompt?.system_prompt || "You help AllYouConvert write useful file-conversion guides.",
    task_prompt: prompt?.task_prompt || "Return structured JSON only.",
    prompt_version: typeof prompt?.version === "number" ? prompt.version : null,
  };
}

export async function listRecentBatches(client: StaffClient, limit = 20) {
  const { data, error } = await client
    .from("generation_batches")
    .select("id, topic, article_type, requested_count, publishing_mode, status, progress, created_by, created_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => asBatch(row as Record<string, unknown>));
}

export async function fetchBatch(client: StaffClient, id: string) {
  const { data, error } = await client
    .from("generation_batches")
    .select("id, topic, article_type, requested_count, publishing_mode, status, progress, created_by, created_at, updated_at")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? asBatch(data as Record<string, unknown>) : null;
}

export async function listJobsForBatch(client: StaffClient, batchId: string) {
  const { data, error } = await client
    .from("generation_jobs")
    .select("id, batch_id, title, outline, draft, validation, stage, status, attempts, error, token_usage, post_id, created_at, updated_at")
    .eq("batch_id", batchId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => asJob(row as Record<string, unknown>));
}

export async function fetchJob(client: StaffClient, id: string) {
  const { data, error } = await client
    .from("generation_jobs")
    .select("id, batch_id, title, outline, draft, validation, stage, status, attempts, error, token_usage, post_id, created_at, updated_at")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? asJob(data as Record<string, unknown>) : null;
}

export async function listExistingGuideSignals(client: StaffClient) {
  const { data, error } = await client
    .from("blog_posts")
    .select("title, slug, status")
    .order("updated_at", { ascending: false })
    .limit(80);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    title: String(row.title ?? ""),
    slug: String(row.slug ?? ""),
    status: String(row.status ?? ""),
  }));
}

export async function countRecentJobs(client: StaffClient, userId: string, hours = 1) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  const { data, error } = await client.from("generation_batches").select("id").eq("created_by", userId).gte("created_at", since);
  if (error) throw new Error(error.message);
  const ids = (data ?? []).map((row) => String(row.id));
  if (!ids.length) return { batches: 0, jobs: 0 };
  const jobs = await client.from("generation_jobs").select("id", { count: "exact", head: true }).in("batch_id", ids).gte("created_at", since);
  return { batches: ids.length, jobs: jobs.count ?? 0 };
}

export async function hourlyJobLimit(client: StaffClient) {
  const { data } = await client.from("site_settings").select("value").eq("key", "generation_hourly_job_limit").maybeSingle();
  const value = data?.value;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) && n > 0 ? n : 8;
}

export async function insertBatch(
  client: StaffClient,
  input: {
    topic: string;
    articleType: ArticleType;
    requestedCount: number;
    actorId: string;
    progress: BatchProgress;
  },
) {
  const { data, error } = await client
    .from("generation_batches")
    .insert({
      topic: input.topic,
      article_type: input.articleType,
      requested_count: Math.min(15, Math.max(1, input.requestedCount)),
      publishing_mode: "draft",
      status: "running",
      progress: input.progress,
      created_by: input.actorId,
    })
    .select("id, topic, article_type, requested_count, publishing_mode, status, progress, created_by, created_at, updated_at")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Could not create generation batch.");
  return asBatch(data as Record<string, unknown>);
}

export async function updateBatch(
  client: StaffClient,
  id: string,
  patch: { status?: GenerationBatchStatus; progress?: BatchProgress },
) {
  const { error } = await client.from("generation_batches").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function insertJob(
  client: StaffClient,
  input: {
    batchId: string;
    title: string;
    idempotencyKey: string;
  },
) {
  const { data, error } = await client
    .from("generation_jobs")
    .insert({
      batch_id: input.batchId,
      title: input.title,
      stage: "queued",
      status: "running",
      attempts: 1,
      token_usage: { steps: [], promptVersions: {} },
      idempotency_key: input.idempotencyKey,
      heartbeat_at: new Date().toISOString(),
    })
    .select("id, batch_id, title, outline, draft, validation, stage, status, attempts, error, token_usage, post_id, created_at, updated_at")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Could not create generation job.");
  return asJob(data as Record<string, unknown>);
}

export async function updateJob(
  client: StaffClient,
  id: string,
  patch: {
    stage?: GenerationJobStage;
    status?: GenerationJobStatus;
    outline?: Record<string, unknown> | null;
    draft?: Record<string, unknown> | null;
    validation?: Record<string, unknown> | null;
    error?: string | null;
    token_usage?: GenerationTrace;
    post_id?: string | null;
    attempts?: number;
  },
) {
  const { error } = await client
    .from("generation_jobs")
    .update({ ...patch, heartbeat_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}
