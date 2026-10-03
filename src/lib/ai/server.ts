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
  type GenerationMediaJob,
  type GenerationTrace,
  type PublishingMode,
  type TitleCandidate,
  type WorkerSettings,
} from "@/lib/ai/types";
import { slugify } from "@/lib/cms/slug";
import type { StaffClient } from "@/lib/cms/server";

const BATCH_SELECT =
  "id, topic, article_type, requested_count, publishing_mode, status, progress, cancel_requested, cost_estimate_usd, created_by, created_at, updated_at";
const JOB_SELECT =
  "id, batch_id, title, outline, draft, validation, stage, status, attempts, max_attempts, error, token_usage, post_id, cancel_requested, next_attempt_at, heartbeat_at, cost_estimate_usd, created_at, updated_at";
const MEDIA_SELECT =
  "id, batch_id, generation_job_id, post_id, media_asset_id, kind, status, attempts, max_attempts, error, token_usage, cancel_requested, next_attempt_at, heartbeat_at, prompt_hash, seed, payload, moderation, cost_estimate_usd, created_at, updated_at";

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

function asPublishingMode(value: unknown): PublishingMode {
  return value === "scheduled" || value === "auto" ? value : "draft";
}

function settingNumber(value: unknown, fallback: number) {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
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
    source: raw.source === "daily_bot" ? "daily_bot" : raw.source === "manual" ? "manual" : undefined,
    publishAt: typeof raw.publishAt === "string" ? raw.publishAt : undefined,
    slotId: typeof raw.slotId === "string" ? raw.slotId : undefined,
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
    selectedIndexes: Array.isArray(raw.selectedIndexes)
      ? raw.selectedIndexes.filter((item): item is number => typeof item === "number")
      : undefined,
    jobsTotal: typeof raw.jobsTotal === "number" ? raw.jobsTotal : undefined,
    jobsCompleted: typeof raw.jobsCompleted === "number" ? raw.jobsCompleted : undefined,
    jobsFailed: typeof raw.jobsFailed === "number" ? raw.jobsFailed : undefined,
    jobsCancelled: typeof raw.jobsCancelled === "number" ? raw.jobsCancelled : undefined,
    mediaTotal: typeof raw.mediaTotal === "number" ? raw.mediaTotal : undefined,
    mediaCompleted: typeof raw.mediaCompleted === "number" ? raw.mediaCompleted : undefined,
    mediaFailed: typeof raw.mediaFailed === "number" ? raw.mediaFailed : undefined,
    lastHeartbeatAt: typeof raw.lastHeartbeatAt === "string" ? raw.lastHeartbeatAt : undefined,
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
    publishing_mode: asPublishingMode(row.publishing_mode),
    status: asBatchStatus(row.status),
    progress: parseProgress(row.progress),
    cancel_requested: row.cancel_requested === true,
    cost_estimate_usd: typeof row.cost_estimate_usd === "number" ? row.cost_estimate_usd : null,
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
    max_attempts: typeof row.max_attempts === "number" ? row.max_attempts : 3,
    error: typeof row.error === "string" ? row.error : null,
    token_usage: asTrace(row.token_usage),
    post_id: typeof row.post_id === "string" ? row.post_id : null,
    cancel_requested: row.cancel_requested === true,
    next_attempt_at: typeof row.next_attempt_at === "string" ? row.next_attempt_at : null,
    heartbeat_at: typeof row.heartbeat_at === "string" ? row.heartbeat_at : null,
    cost_estimate_usd: typeof row.cost_estimate_usd === "number" ? row.cost_estimate_usd : null,
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
  };
}

function asMediaJob(row: Record<string, unknown>): GenerationMediaJob {
  return {
    id: String(row.id),
    batch_id: String(row.batch_id),
    generation_job_id: typeof row.generation_job_id === "string" ? row.generation_job_id : null,
    post_id: typeof row.post_id === "string" ? row.post_id : null,
    media_asset_id: typeof row.media_asset_id === "string" ? row.media_asset_id : null,
    kind: "cover_illustration",
    status: asJobStatus(row.status),
    attempts: typeof row.attempts === "number" ? row.attempts : 0,
    max_attempts: typeof row.max_attempts === "number" ? row.max_attempts : 3,
    error: typeof row.error === "string" ? row.error : null,
    token_usage: asTrace(row.token_usage),
    cancel_requested: row.cancel_requested === true,
    next_attempt_at: typeof row.next_attempt_at === "string" ? row.next_attempt_at : null,
    heartbeat_at: typeof row.heartbeat_at === "string" ? row.heartbeat_at : null,
    prompt_hash: typeof row.prompt_hash === "string" ? row.prompt_hash : null,
    seed: typeof row.seed === "string" ? row.seed : null,
    payload: row.payload && typeof row.payload === "object" ? (row.payload as Record<string, unknown>) : {},
    moderation: row.moderation && typeof row.moderation === "object" ? (row.moderation as Record<string, unknown>) : null,
    cost_estimate_usd: typeof row.cost_estimate_usd === "number" ? row.cost_estimate_usd : null,
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
  const { data, error } = await client.from("generation_batches").select(BATCH_SELECT).order("created_at", { ascending: false }).limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => asBatch(row as Record<string, unknown>));
}

export async function fetchBatch(client: StaffClient, id: string) {
  const { data, error } = await client.from("generation_batches").select(BATCH_SELECT).eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? asBatch(data as Record<string, unknown>) : null;
}

export async function listJobsForBatch(client: StaffClient, batchId: string) {
  const { data, error } = await client.from("generation_jobs").select(JOB_SELECT).eq("batch_id", batchId).order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => asJob(row as Record<string, unknown>));
}

export async function fetchJob(client: StaffClient, id: string) {
  const { data, error } = await client.from("generation_jobs").select(JOB_SELECT).eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? asJob(data as Record<string, unknown>) : null;
}

export async function listExistingGuideSignals(client: StaffClient) {
  const { data, error } = await client.from("blog_posts").select("title, slug, status").order("updated_at", { ascending: false }).limit(80);
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
  const settings = await loadWorkerSettings(client);
  return settings.hourlyJobLimit;
}

export async function insertBatch(
  client: StaffClient,
  input: {
    topic: string;
    articleType: ArticleType;
    requestedCount: number;
    actorId: string;
    progress: BatchProgress;
    publishingMode?: PublishingMode;
  },
) {
  const { data, error } = await client
    .from("generation_batches")
    .insert({
      topic: input.topic,
      article_type: input.articleType,
      requested_count: Math.min(15, Math.max(1, input.requestedCount)),
      publishing_mode: input.publishingMode ?? "draft",
      status: "pending",
      progress: input.progress,
      created_by: input.actorId,
    })
    .select(BATCH_SELECT)
    .single();
  if (error || !data) throw new Error(error?.message ?? "Could not create generation batch.");
  return asBatch(data as Record<string, unknown>);
}

export async function updateBatch(
  client: StaffClient,
  id: string,
  patch: {
    status?: GenerationBatchStatus;
    progress?: BatchProgress;
    publishing_mode?: PublishingMode;
    requested_count?: number;
    cancel_requested?: boolean;
    cost_estimate_usd?: number | null;
  },
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
    maxAttempts?: number;
  },
) {
  const { data, error } = await client
    .from("generation_jobs")
    .insert({
      batch_id: input.batchId,
      title: input.title,
      stage: "queued",
      status: "pending",
      attempts: 0,
      max_attempts: input.maxAttempts ?? 3,
      token_usage: { steps: [], promptVersions: {} },
      idempotency_key: input.idempotencyKey,
      next_attempt_at: new Date().toISOString(),
    })
    .select(JOB_SELECT)
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
    cancel_requested?: boolean;
    next_attempt_at?: string | null;
    cost_estimate_usd?: number | null;
    heartbeat?: boolean;
  },
) {
  const { heartbeat = true, ...rest } = patch;
  const { error } = await client
    .from("generation_jobs")
    .update(heartbeat ? { ...rest, heartbeat_at: new Date().toISOString() } : rest)
    .eq("id", id);
  if (error) throw new Error(error.message);
}

async function settingMap(client: StaffClient, keys: string[]) {
  const { data, error } = await client.from("site_settings").select("key, value").in("key", keys);
  if (error) throw new Error(error.message);
  return Object.fromEntries((data ?? []).map((row) => [String(row.key), row.value]));
}

export async function loadWorkerSettings(client: StaffClient): Promise<WorkerSettings> {
  const values = await settingMap(client, [
    "generation_hourly_job_limit",
    "generation_max_attempts",
    "generation_concurrency",
    "generation_media_concurrency",
    "generation_stale_seconds",
    "generation_job_timeout_seconds",
    "auto_publish_enabled",
    "auto_publish_stagger_minutes",
    "default_publishing_mode",
  ]);
  const mode = values.default_publishing_mode;
  const modeText = typeof mode === "string" ? mode.replaceAll('"', "") : mode;
  return {
    hourlyJobLimit: Math.max(1, settingNumber(values.generation_hourly_job_limit, 24)),
    maxAttempts: Math.min(8, Math.max(1, settingNumber(values.generation_max_attempts, 3))),
    articleConcurrency: Math.min(4, Math.max(1, settingNumber(values.generation_concurrency, 2))),
    mediaConcurrency: Math.min(4, Math.max(1, settingNumber(values.generation_media_concurrency, 2))),
    staleSeconds: Math.min(900, Math.max(30, settingNumber(values.generation_stale_seconds, 300))),
    jobTimeoutSeconds: Math.min(300, Math.max(60, settingNumber(values.generation_job_timeout_seconds, 240))),
    autoPublishEnabled: values.auto_publish_enabled === true || values.auto_publish_enabled === "true",
    autoPublishStaggerMinutes: Math.min(240, Math.max(5, settingNumber(values.auto_publish_stagger_minutes, 30))),
    defaultPublishingMode: asPublishingMode(modeText),
  };
}

export async function listMediaJobsForBatch(client: StaffClient, batchId: string) {
  const { data, error } = await client.from("generation_media_jobs").select(MEDIA_SELECT).eq("batch_id", batchId).order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => asMediaJob(row as Record<string, unknown>));
}

export async function fetchMediaJob(client: StaffClient, id: string) {
  const { data, error } = await client.from("generation_media_jobs").select(MEDIA_SELECT).eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? asMediaJob(data as Record<string, unknown>) : null;
}

export async function insertMediaJob(
  client: StaffClient,
  input: {
    batchId: string;
    generationJobId: string;
    postId: string;
    kind?: "cover_illustration";
    idempotencyKey: string;
    payload: Record<string, unknown>;
    promptHash?: string | null;
    seed?: string | null;
    maxAttempts?: number;
  },
) {
  const { data, error } = await client
    .from("generation_media_jobs")
    .insert({
      batch_id: input.batchId,
      generation_job_id: input.generationJobId,
      post_id: input.postId,
      kind: input.kind ?? "cover_illustration",
      status: "pending",
      attempts: 0,
      max_attempts: input.maxAttempts ?? 3,
      token_usage: { steps: [], promptVersions: {} },
      idempotency_key: input.idempotencyKey,
      next_attempt_at: new Date().toISOString(),
      payload: input.payload,
      prompt_hash: input.promptHash ?? null,
      seed: input.seed ?? null,
    })
    .select(MEDIA_SELECT)
    .single();
  if (error) {
    if (/duplicate|unique/i.test(error.message)) {
      const existing = await client.from("generation_media_jobs").select(MEDIA_SELECT).eq("idempotency_key", input.idempotencyKey).maybeSingle();
      if (existing.data) return asMediaJob(existing.data as Record<string, unknown>);
    }
    throw new Error(error.message);
  }
  if (!data) throw new Error("Could not create media job.");
  return asMediaJob(data as Record<string, unknown>);
}

export async function updateMediaJob(
  client: StaffClient,
  id: string,
  patch: {
    status?: GenerationJobStatus;
    error?: string | null;
    token_usage?: GenerationTrace;
    media_asset_id?: string | null;
    post_id?: string | null;
    cancel_requested?: boolean;
    next_attempt_at?: string | null;
    moderation?: Record<string, unknown> | null;
    cost_estimate_usd?: number | null;
    seed?: string | null;
    prompt_hash?: string | null;
    attempts?: number;
    heartbeat?: boolean;
  },
) {
  const { heartbeat = true, ...rest } = patch;
  const { error } = await client
    .from("generation_media_jobs")
    .update(heartbeat ? { ...rest, heartbeat_at: new Date().toISOString() } : rest)
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function claimGenerationJobs(client: StaffClient, limit: number, workerId: string, staleSeconds: number): Promise<GenerationJob[]> {
  const { data, error } = await client.rpc("claim_generation_jobs", {
    p_limit: limit,
    p_worker_id: workerId,
    p_stale_seconds: staleSeconds,
  });
  if (error) throw new Error(error.message);
  return ((data ?? []) as Record<string, unknown>[]).map((row) => asJob(row));
}

export async function claimMediaJobs(client: StaffClient, limit: number, workerId: string, staleSeconds: number): Promise<GenerationMediaJob[]> {
  const { data, error } = await client.rpc("claim_generation_media_jobs", {
    p_limit: limit,
    p_worker_id: workerId,
    p_stale_seconds: staleSeconds,
  });
  if (error) throw new Error(error.message);
  return ((data ?? []) as Record<string, unknown>[]).map((row) => asMediaJob(row));
}

export async function fetchStaffRole(client: StaffClient, userId: string | null) {
  if (!userId) return null;
  const { data, error } = await client.from("admin_profiles").select("role").eq("user_id", userId).maybeSingle();
  if (error) throw new Error(error.message);
  const role = data?.role;
  return typeof role === "string" ? role : null;
}

export function backoffIso(attempts: number) {
  const seconds = Math.min(900, 20 * 2 ** Math.max(0, attempts - 1));
  return new Date(Date.now() + seconds * 1000).toISOString();
}

export async function syncBatchProgress(client: StaffClient, batchId: string) {
  const [batch, jobs, media] = await Promise.all([
    fetchBatch(client, batchId),
    listJobsForBatch(client, batchId),
    listMediaJobsForBatch(client, batchId),
  ]);
  if (!batch) return null;

  const jobsCancelled = jobs.filter((job) => job.status === "cancelled").length;
  const jobsFailed = jobs.filter((job) => job.status === "failed").length;
  const jobsCompleted = jobs.filter((job) => job.status === "completed").length;
  const jobsRunning = jobs.filter((job) => job.status === "running" || job.status === "pending").length;
  const mediaFailed = media.filter((job) => job.status === "failed").length;
  const mediaCompleted = media.filter((job) => job.status === "completed").length;
  const mediaRunning = media.filter((job) => job.status === "running" || job.status === "pending").length;
  const tokenCost = [...jobs, ...media].reduce((sum, job) => sum + (job.cost_estimate_usd ?? 0), 0);

  let status: GenerationBatchStatus = batch.status;
  if (batch.cancel_requested && jobsRunning === 0 && mediaRunning === 0) {
    status = jobsCompleted > 0 ? "partial" : "cancelled";
  } else if (jobsRunning > 0 || mediaRunning > 0) {
    status = "running";
  } else if (jobs.length > 0 && jobsCompleted === jobs.length && mediaFailed === 0 && mediaRunning === 0) {
    status = "completed";
  } else if (jobsCompleted > 0 && (jobsFailed > 0 || jobsCancelled > 0 || mediaFailed > 0)) {
    status = "partial";
  } else if (jobs.length > 0 && jobsFailed + jobsCancelled === jobs.length) {
    status = jobsCancelled === jobs.length ? "cancelled" : "failed";
  }

  const progress: BatchProgress = {
    ...batch.progress,
    jobsTotal: jobs.length,
    jobsCompleted,
    jobsFailed,
    jobsCancelled,
    mediaTotal: media.length,
    mediaCompleted,
    mediaFailed,
    lastHeartbeatAt: new Date().toISOString(),
  };

  await updateBatch(client, batchId, { status, progress, cost_estimate_usd: tokenCost || null });
  return { ...batch, status, progress, cost_estimate_usd: tokenCost || null };
}
