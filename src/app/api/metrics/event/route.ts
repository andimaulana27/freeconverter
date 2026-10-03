import { NextResponse } from "next/server";
import { incrementProductMetric, PRODUCT_METRIC_KEYS } from "@/lib/cms/metrics";

export const dynamic = "force-dynamic";

const buckets = new Map<string, { count: number; resetAt: number }>();

function limited(ip: string) {
  const now = Date.now();
  const current = buckets.get(ip);
  if (!current || current.resetAt < now) {
    buckets.set(ip, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  current.count += 1;
  return current.count > 40;
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (limited(ip)) return NextResponse.json({ ok: false }, { status: 429 });

  let body: { path?: string; key?: string } = {};
  try {
    body = (await request.json()) as { path?: string; key?: string };
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const key = body.key;
  if (!key || !(PRODUCT_METRIC_KEYS as readonly string[]).includes(key)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const result = await incrementProductMetric(String(body.path ?? ""), key as (typeof PRODUCT_METRIC_KEYS)[number]);
  return NextResponse.json(result);
}
