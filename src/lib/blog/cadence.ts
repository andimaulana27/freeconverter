import { ARTICLE_TYPES, type ArticleType } from "@/lib/ai/types";

export const DAILY_BLOG_TIMEZONE = "Asia/Jakarta";
export const DAILY_BLOG_LEAD_MINUTES = 45;
export const DAILY_BLOG_GRACE_MINUTES = 180;
export const DAILY_BLOG_MAX_COUNT = 8;
export const DEFAULT_DAILY_PUBLISH_COUNT = 4;

const EXTRA_TIMES = ["08:00", "12:00", "16:00", "20:00", "21:30", "10:30", "14:30", "18:30"];

export type DailyCadence = {
  enabled: boolean;
  count: number;
  times: string[];
  timezone: string;
};

export type EditorialSlotView = {
  time: string;
  status: string;
  toolSlug: string | null;
  error: string | null;
  runAt: string;
};

export type CadenceTool = {
  slug: string;
  title: string;
};

export function normalizeClock(value: string) {
  const match = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(value.trim());
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour > 23 || minute > 59) return null;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function resolveDailyTimes(count: number, stored: string[]) {
  const limit = Math.min(DAILY_BLOG_MAX_COUNT, Math.max(1, Math.round(count) || DEFAULT_DAILY_PUBLISH_COUNT));
  const unique: string[] = [];
  for (const value of stored) {
    const time = normalizeClock(value);
    if (time && !unique.includes(time)) unique.push(time);
  }
  for (const time of EXTRA_TIMES) {
    if (unique.length >= limit) break;
    if (!unique.includes(time)) unique.push(time);
  }
  let hour = 7;
  while (unique.length < limit && hour <= 22) {
    const time = `${String(hour).padStart(2, "0")}:00`;
    if (!unique.includes(time)) unique.push(time);
    hour += 2;
  }
  return unique.slice(0, limit).sort();
}

function jsonBoolean(value: unknown, fallback: boolean) {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

function jsonNumber(value: unknown, fallback: number) {
  const number = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(number) ? number : fallback;
}

function jsonString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export function safeTimeZone(value: string) {
  try {
    Intl.DateTimeFormat("en-US", { timeZone: value }).format(new Date());
    return value;
  } catch {
    return DAILY_BLOG_TIMEZONE;
  }
}

export function parseDailyCadence(values: Record<string, unknown>): DailyCadence {
  const count = Math.min(
    DAILY_BLOG_MAX_COUNT,
    Math.max(1, Math.round(jsonNumber(values.daily_publish_count, DEFAULT_DAILY_PUBLISH_COUNT))),
  );
  const stored = Array.isArray(values.daily_publish_times)
    ? values.daily_publish_times.filter((item): item is string => typeof item === "string")
    : [];
  return {
    enabled: jsonBoolean(values.daily_blog_enabled, true),
    count,
    times: resolveDailyTimes(count, stored),
    timezone: safeTimeZone(jsonString(values.daily_blog_timezone, DAILY_BLOG_TIMEZONE)),
  };
}

export function zonedDateKey(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: safeTimeZone(timeZone),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function zonedParts(date: Date, timeZone: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: safeTimeZone(timeZone),
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  );
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
  };
}

export function zonedSlotToUtc(date: string, time: string, timeZone: string) {
  const zone = safeTimeZone(timeZone);
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  let utc = Date.UTC(year, month - 1, day, hour, minute, 0);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const local = zonedParts(new Date(utc), zone);
    const localAsUtc = Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute, 0);
    const desired = Date.UTC(year, month - 1, day, hour, minute, 0);
    if (localAsUtc === desired) break;
    utc += desired - localAsUtc;
  }
  return new Date(utc);
}

export function isSlotDue(runAt: Date, now: Date, leadMinutes = DAILY_BLOG_LEAD_MINUTES, graceMinutes = DAILY_BLOG_GRACE_MINUTES) {
  const start = runAt.getTime() - leadMinutes * 60_000;
  const end = runAt.getTime() + graceMinutes * 60_000;
  const current = now.getTime();
  return current >= start && current <= end;
}

export function clockOrSoon(publishAt: string | undefined, now = Date.now()) {
  const requested = publishAt ? new Date(publishAt).getTime() : Number.NaN;
  const when = Number.isFinite(requested) && requested > now ? requested : now + 2 * 60_000;
  return new Date(when).toISOString();
}

function hashText(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function articleTypeForSlot(date: string, slotIndex: number): ArticleType {
  return ARTICLE_TYPES[hashText(`${date}:${slotIndex}`) % ARTICLE_TYPES.length] ?? "tool_tutorial";
}

export function pickDailyTool(input: {
  date: string;
  tools: CadenceTool[];
  usage: Record<string, number>;
  reserved: string[];
}) {
  if (!input.tools.length) return null;
  const reserved = new Set(input.reserved);
  const open = input.tools.filter((tool) => !reserved.has(tool.slug));
  const pool = open.length ? open : input.tools;
  return [...pool].sort((left, right) => {
    const leftScore = (input.usage[left.slug] ?? 0) * 100 + (hashText(`${input.date}:${left.slug}`) % 97);
    const rightScore = (input.usage[right.slug] ?? 0) * 100 + (hashText(`${input.date}:${right.slug}`) % 97);
    return leftScore - rightScore || left.slug.localeCompare(right.slug);
  })[0] ?? null;
}
