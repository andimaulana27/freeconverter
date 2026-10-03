import "server-only";

import { productGrounding } from "@/lib/ai/catalog";
import { generateStructured } from "@/lib/ai/generate";
import { sanitizeAiError } from "@/lib/ai/provider";
import { dailyTitleSchema } from "@/lib/ai/schemas";
import { recordProviderResult } from "@/lib/ai/secrets";
import {
  fetchStaffRole,
  insertBatch,
  insertJob,
  listExistingGuideSignals,
  loadModelProfile,
  loadWorkerSettings,
} from "@/lib/ai/server";
import { ARTICLE_TYPE_LABELS, type ArticleType, type BatchProgress, type TitleCandidate } from "@/lib/ai/types";
import {
  articleTypeForSlot,
  isSlotDue,
  parseDailyCadence,
  pickDailyTool,
  zonedDateKey,
  zonedSlotToUtc,
  type DailyCadence,
  type EditorialSlotView,
} from "@/lib/blog/cadence";
import { writeAudit, type StaffClient } from "@/lib/cms/server";
import { slugify } from "@/lib/cms/slug";
import { tools } from "@/lib/tools";

const MAX_PER_TICK = 1;
const MAX_ATTEMPTS = 3;
const RETRY_MS = 15 * 60_000;
const STALE_PLANNING_MS = 10 * 60_000;

const SETTING_KEYS = ["daily_blog_enabled", "daily_publish_count", "daily_publish_times", "daily_blog_timezone"];

type SlotRow = {
  id: string;
  slot_time: string;
  run_at: string;
  status: string;
  attempts: number;
  next_attempt_at: string | null;
  error: string | null;
  job_id: string | null;
  post_id: string | null;
  tool_slug: string | null;
  article_type: string | null;
  updated_at: string;
};

function asSlot(row: Record<string, unknown>): SlotRow {
  return {
    id: String(row.id),
    slot_time: String(row.slot_time),
    run_at: String(row.run_at),
    status: String(row.status),
    attempts: typeof row.attempts === "number" ? row.attempts : 0,
    next_attempt_at: typeof row.next_attempt_at === "string" ? row.next_attempt_at : null,
    error: typeof row.error === "string" ? row.error : null,
    job_id: typeof row.job_id === "string" ? row.job_id : null,
    post_id: typeof row.post_id === "string" ? row.post_id : null,
    tool_slug: typeof row.tool_slug === "string" ? row.tool_slug : null,
    article_type: typeof row.article_type === "string" ? row.article_type : null,
    updated_at: String(row.updated_at ?? new Date().toISOString()),
  };
}

export async function loadDailyCadence(client: StaffClient): Promise<DailyCadence> {
  const { data, error } = await client.from("site_settings").select("key, value").in("key", SETTING_KEYS);
  if (error) throw new Error(error.message);
  return parseDailyCadence(Object.fromEntries((data ?? []).map((row) => [String(row.key), row.value])));
}

export async function listEditorialSlots(client: StaffClient, date: string, timezone: string): Promise<EditorialSlotView[]> {
  const { data, error } = await client
    .from("editorial_slots")
    .select("slot_time, status, tool_slug, error, run_at")
    .eq("slot_on", date)
    .eq("timezone", timezone)
    .order("slot_time", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    time: String(row.slot_time),
    status: String(row.status),
    toolSlug: typeof row.tool_slug === "string" ? row.tool_slug : null,
    error: typeof row.error === "string" ? row.error : null,
    runAt: String(row.run_at),
  })) satisfies EditorialSlotView[];
}

export async function markEditorialSlot(
  client: StaffClient,
  slotId: string,
  patch: { status?: string; post_id?: string; error?: string | null },
) {
  const { error } = await client.from("editorial_slots").update(patch).eq("id", slotId);
  if (error) throw new Error(error.message);
}

function canRetry(row: SlotRow, now: number) {
  if (row.job_id || row.attempts >= MAX_ATTEMPTS) return false;
  if (row.status === "failed") {
    return !row.next_attempt_at || new Date(row.next_attempt_at).getTime() <= now;
  }
  if (row.status === "planning") {
    return now - new Date(row.updated_at).getTime() >= STALE_PLANNING_MS;
  }
  return false;
}

async function toolUsage(client: StaffClient) {
  const { data, error } = await client.from("blog_posts").select("tool_slugs, status").neq("status", "archived").limit(500);
  if (error) throw new Error(error.message);
  const usage: Record<string, number> = {};
  for (const row of data ?? []) {
    const slugs = Array.isArray(row.tool_slugs) ? row.tool_slugs : [];
    for (const slug of slugs) {
      if (typeof slug !== "string") continue;
      usage[slug] = (usage[slug] ?? 0) + 1;
    }
  }
  return usage;
}

async function jobsInLastHour(client: StaffClient) {
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error } = await client
    .from("generation_jobs")
    .select("id", { count: "exact", head: true })
    .gte("created_at", since);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

async function resolveBotOwner(client: StaffClient) {
  const { data, error } = await client
    .from("admin_profiles")
    .select("user_id, role")
    .eq("is_active", true)
    .in("role", ["super_admin", "editor"]);
  if (error) throw new Error(error.message);
  const rows = data ?? [];
  const publisher = rows.find((row) => row.role === "super_admin") ?? rows.find((row) => row.role === "editor");
  return publisher ? String(publisher.user_id) : null;
}

function directionFor(tool: { title: string; slug: string; need: string; inputs: string[]; output: string }, articleType: ArticleType) {
  const angle: Record<ArticleType, string> = {
    tool_tutorial: "a practical how-to",
    comparison: "a comparison that helps the reader choose",
    troubleshooting: "a troubleshooting guide",
    workflow: "a short workflow",
    privacy: "a privacy and processing explainer",
    glossary: "a plain-language explainer",
  };
  return [
    `Write ${angle[articleType]} a searcher could open from a general question about files, formats, or everyday tasks.`,
    `The solution is ${tool.title} (${tool.slug}). Link to /${tool.slug} and keep that tool as the primary recommendation.`,
    `Catalog facts only: inputs ${tool.inputs.join(", ") || "the listed formats"}, output ${tool.output}, processing ${tool.need}.`,
    "Do not invent formats, limits, or legal claims. Do not ask for a generated cover image.",
  ].join(" ");
}

async function queueSlotArticle(input: {
  client: StaffClient;
  slot: SlotRow;
  ownerId: string;
  role: string;
  tool: { slug: string; title: string; category: string; need: string; inputs: string[]; output: string };
  articleType: ArticleType;
  runAt: Date;
}) {
  const nextAttempts = input.slot.attempts + 1;
  await input.client
    .from("editorial_slots")
    .update({
      status: "planning",
      attempts: nextAttempts,
      error: null,
      tool_slug: input.tool.slug,
      article_type: input.articleType,
    })
    .eq("id", input.slot.id);

  try {
    const profile = await loadModelProfile(input.client, "title_ideation");
    const existing = await listExistingGuideSignals(input.client);
    let title: TitleCandidate;
    try {
      const result = await generateStructured({
        profile,
        schema: dailyTitleSchema,
        name: "DailyTitle",
        extraSystem: productGrounding(),
        prompt: JSON.stringify(
          {
            articleType: input.articleType,
            topic: input.tool.category,
            direction: directionFor(input.tool, input.articleType),
            focusTool: input.tool,
            existingGuides: existing.slice(0, 40),
            rules: [
              "Return one distinct search title.",
              "The article must lead to the focus tool.",
              "A general or educational angle is fine when the steps still use that tool.",
              "Do not repeat an existing guide title.",
            ],
          },
          null,
          2,
        ),
      });
      await recordProviderResult({ client: input.client, role: input.role });
      title = {
        title: result.output.title.trim(),
        slugSuggestion: slugify(result.output.slugSuggestion || result.output.title),
        searchIntent: result.output.searchIntent.trim(),
        articleType: input.articleType,
        targetToolSlugs: [input.tool.slug],
        rationale: result.output.rationale.trim(),
        rejected: false,
      };
    } catch (error) {
      await recordProviderResult({ client: input.client, role: input.role, error });
      throw error;
    }

    const settings = await loadWorkerSettings(input.client);
    const progress: BatchProgress = {
      source: "daily_bot",
      publishAt: input.runAt.toISOString(),
      slotId: input.slot.id,
      direction: directionFor(input.tool, input.articleType),
      audience: "people who need to convert or fix a file",
      language: "en",
      tone: "clear and practical",
      targetToolSlugs: [input.tool.slug],
      includeIllustration: false,
      titles: [title],
    };
    const batch = await insertBatch(input.client, {
      topic: `${input.tool.title} · ${ARTICLE_TYPE_LABELS[input.articleType]}`,
      articleType: input.articleType,
      requestedCount: 1,
      actorId: input.ownerId,
      progress,
      publishingMode: "auto",
    });
    const job = await insertJob(input.client, {
      batchId: batch.id,
      title: title.title,
      idempotencyKey: `${batch.id}:${title.slugSuggestion}`,
      maxAttempts: settings.maxAttempts,
    });
    const { error } = await input.client
      .from("editorial_slots")
      .update({
        status: "queued",
        batch_id: batch.id,
        job_id: job.id,
        error: null,
        next_attempt_at: null,
      })
      .eq("id", input.slot.id);
    if (error) throw new Error(error.message);
    await writeAudit(input.client, {
      actorId: input.ownerId,
      action: "generation.daily_plan",
      entityType: "editorial_slot",
      entityId: input.slot.id,
      metadata: {
        tool: input.tool.slug,
        articleType: input.articleType,
        publishAt: input.runAt.toISOString(),
        batchId: batch.id,
      },
    });
    return true;
  } catch (error) {
    const message = sanitizeAiError(error).slice(0, 500);
    await input.client
      .from("editorial_slots")
      .update({
        status: "failed",
        error: message,
        next_attempt_at: new Date(Date.now() + RETRY_MS).toISOString(),
      })
      .eq("id", input.slot.id);
    return false;
  }
}

export async function planDailyBlog(client: StaffClient) {
  const cadence = await loadDailyCadence(client);
  if (!cadence.enabled) return { queued: 0 };

  const now = new Date();
  const settings = await loadWorkerSettings(client);
  if ((await jobsInLastHour(client)) >= settings.hourlyJobLimit) return { queued: 0 };

  const ownerId = await resolveBotOwner(client);
  if (!ownerId) {
    console.error("daily blog bot has no active publisher");
    return { queued: 0 };
  }
  const role = (await fetchStaffRole(client, ownerId)) ?? "super_admin";
  const today = zonedDateKey(now, cadence.timezone);
  const { data, error } = await client
    .from("editorial_slots")
    .select("id, slot_time, run_at, status, attempts, next_attempt_at, error, job_id, post_id, tool_slug, article_type, updated_at")
    .eq("slot_on", today)
    .eq("timezone", cadence.timezone);
  if (error) throw new Error(error.message);
  const rows = (data ?? []).map((row) => asSlot(row as Record<string, unknown>));
  const usage = await toolUsage(client);
  const catalog = tools
    .filter((tool) => tool.v1)
    .map((tool) => ({
      slug: tool.slug,
      title: tool.title,
      category: tool.category,
      need: tool.need,
      inputs: tool.inputs,
      output: tool.output,
    }));

  let queued = 0;
  let attempts = 0;
  for (const [slotIndex, time] of cadence.times.entries()) {
    if (attempts >= MAX_PER_TICK) break;
    const runAt = zonedSlotToUtc(today, time, cadence.timezone);
    if (!isSlotDue(runAt, now)) continue;
    const existing = rows.find((row) => row.slot_time === time);
    if (existing && !canRetry(existing, now.getTime())) continue;

    const reserved = rows.flatMap((row) => (row.tool_slug && row.status !== "failed" ? [row.tool_slug] : []));
    const picked = pickDailyTool({ date: today, tools: catalog, usage, reserved });
    const tool = catalog.find((item) => item.slug === picked?.slug);
    if (!tool) continue;
    const articleType = articleTypeForSlot(today, slotIndex);

    let slot = existing ?? null;
    if (!slot) {
      const inserted = await client
        .from("editorial_slots")
        .insert({
          slot_on: today,
          slot_time: time,
          timezone: cadence.timezone,
          run_at: runAt.toISOString(),
          status: "planning",
          attempts: 0,
          tool_slug: tool.slug,
          article_type: articleType,
        })
        .select("id, slot_time, run_at, status, attempts, next_attempt_at, error, job_id, post_id, tool_slug, article_type, updated_at")
        .maybeSingle();
      if (inserted.error) {
        if (/duplicate|unique/i.test(inserted.error.message)) continue;
        throw new Error(inserted.error.message);
      }
      if (!inserted.data) continue;
      slot = asSlot(inserted.data as Record<string, unknown>);
      rows.push(slot);
    }

    const wrote = await queueSlotArticle({ client, slot, ownerId, role, tool, articleType, runAt });
    attempts += 1;
    if (wrote) queued += 1;
  }

  return { queued };
}
