import "server-only";

import { getTool } from "@/lib/tools";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import type { MetricRow } from "@/lib/cms/types";
import type { StaffClient } from "@/lib/cms/server";

export const PRODUCT_METRIC_KEYS = ["guide_view", "tool_start", "guide_tool_click"] as const;
export const GSC_METRIC_KEYS = ["gsc_impressions", "gsc_clicks"] as const;

function utcDate(value?: string) {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return new Date().toISOString().slice(0, 10);
}

export function sanitizeMetricPath(path: string) {
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\") || path.includes("..")) return null;
  if (path.startsWith("/admin") || path.length > 180) return null;
  const clean = path.split("?")[0].split("#")[0];
  if (!/^\/[a-z0-9][a-z0-9\-/#]*$/i.test(clean)) return null;
  return clean;
}

async function productMetricsEnabled(client: ReturnType<typeof createServiceSupabaseClient>) {
  const { data } = await client.from("site_settings").select("value").eq("key", "growth_metrics_enabled").maybeSingle();
  return data?.value !== false;
}

export async function incrementProductMetric(path: string, key: (typeof PRODUCT_METRIC_KEYS)[number]) {
  const safePath = sanitizeMetricPath(path);
  if (!safePath) return { ok: false as const };
  if (key === "tool_start" && !getTool(safePath.slice(1))) return { ok: false as const };
  if ((key === "guide_view" || key === "guide_tool_click") && !safePath.startsWith("/blog/")) return { ok: false as const };
  const client = createServiceSupabaseClient();
  if (!(await productMetricsEnabled(client))) return { ok: false as const };
  const { data, error } = await client.rpc("increment_content_metric", { p_path: safePath, p_key: key });
  if (error || data !== true) return { ok: false as const };
  return { ok: true as const };
}

export async function upsertGscMetric(client: StaffClient, input: { date: string; path: string; key: (typeof GSC_METRIC_KEYS)[number]; value: number }) {
  const path = sanitizeMetricPath(input.path);
  if (!path) throw new Error("Invalid page path.");
  const metricDate = utcDate(input.date);
  const value = Math.max(0, Math.round(input.value));
  const { data } = await client
    .from("content_metrics_daily")
    .select("id")
    .eq("metric_date", metricDate)
    .eq("path", path)
    .eq("metric_key", input.key)
    .maybeSingle();
  if (data?.id) {
    const { error } = await client.from("content_metrics_daily").update({ value, source: "gsc" }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return;
  }
  const { error } = await client.from("content_metrics_daily").insert({
    metric_date: metricDate,
    path,
    metric_key: input.key,
    value,
    source: "gsc",
  });
  if (error) throw new Error(error.message);
}

export async function listMetricsSince(client: StaffClient, days = 14) {
  const since = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
  const { data, error } = await client
    .from("content_metrics_daily")
    .select("id, metric_date, path, metric_key, value, source")
    .gte("metric_date", since)
    .order("metric_date", { ascending: false })
    .limit(2000);
  if (error) throw new Error(error.message);
  return (data ?? []) as MetricRow[];
}

export function parseGscCsv(raw: string) {
  const rows: { date: string; path: string; impressions: number; clicks: number }[] = [];
  const lines = raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  for (const line of lines) {
    if (/page|url|impressions/i.test(line) && /click/i.test(line)) continue;
    const parts = line.split(/[,\t]/).map((part) => part.trim().replace(/^"|"$/g, ""));
    if (parts.length < 3) continue;
    const url = parts.find((part) => part.includes("/")) ?? "";
    const date = parts.find((part) => /^\d{4}-\d{2}-\d{2}$/.test(part)) ?? utcDate();
    const numbers = parts.map((part) => Number(part.replace(/,/g, ""))).filter((part) => Number.isFinite(part));
    const path = url.replace(/^https?:\/\/[^/]+/i, "") || url;
    if (!path.startsWith("/")) continue;
    rows.push({
      date,
      path,
      impressions: numbers[0] ?? 0,
      clicks: numbers[1] ?? 0,
    });
  }
  return rows.slice(0, 400);
}

export function growthRecommendations(metrics: MetricRow[]) {
  const byKey = new Map<string, number>();
  for (const row of metrics) {
    byKey.set(row.metric_key, (byKey.get(row.metric_key) ?? 0) + row.value);
  }
  const notes: string[] = [];
  const starts = byKey.get("tool_start") ?? 0;
  const views = byKey.get("guide_view") ?? 0;
  const clicks = byKey.get("guide_tool_click") ?? 0;
  const gscClicks = byKey.get("gsc_clicks") ?? 0;
  if (views > 20 && clicks / Math.max(views, 1) < 0.08) {
    notes.push("Guides are being read, but few readers open a tool. Strengthen in-article CTAs and related-tool blocks.");
  }
  if (gscClicks > 30 && starts < gscClicks * 0.2) {
    notes.push("Search clicks are not turning into converter starts. Review titles that overpromise versus the catalog.");
  }
  if (starts > views && views > 0) {
    notes.push("Converter starts outpace guide views. Keep publishing tool tutorials around the converters that already convert.");
  }
  if (!notes.length) notes.push("Keep the current cadence: small reviewed batches around tools that already earn starts.");
  return notes;
}
