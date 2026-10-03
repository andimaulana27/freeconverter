import { NextResponse } from "next/server";
import { scanAdFailures } from "@/lib/cms/editorial-server";
import { processDueSchedules } from "@/lib/cms/schedules";
import { createServiceSupabaseClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

async function run(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const client = createServiceSupabaseClient();
  const result = await processDueSchedules(client, null);
  await scanAdFailures(client);
  return NextResponse.json(result);
}

export async function GET(request: Request) {
  return run(request);
}

export async function POST(request: Request) {
  return run(request);
}
