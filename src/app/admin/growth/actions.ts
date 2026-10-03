"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canManageSecrets } from "@/lib/auth/roles";
import { requireCms, requirePublisher } from "@/lib/auth/session";
import { parseGscCsv, upsertGscMetric } from "@/lib/cms/metrics";
import { writeAudit } from "@/lib/cms/server";

export async function ingestSearchConsoleCsv(formData: FormData) {
  const session = await requireCms("/admin/growth");
  if (!canManageSecrets(session.role)) redirect("/admin/growth?error=forbidden");
  const raw = String(formData.get("csv") ?? "");
  const rows = parseGscCsv(raw);
  if (!rows.length) redirect("/admin/growth?error=csv");
  for (const row of rows) {
    await upsertGscMetric(session.supabase, { date: row.date, path: row.path, key: "gsc_impressions", value: row.impressions });
    await upsertGscMetric(session.supabase, { date: row.date, path: row.path, key: "gsc_clicks", value: row.clicks });
  }
  await writeAudit(session.supabase, {
    actorId: session.user.id,
    action: "metrics.gsc_ingest",
    entityType: "content_metrics_daily",
    entityId: null,
    metadata: { rows: rows.length },
  });
  revalidatePath("/admin/growth");
  redirect(`/admin/growth?ingested=${rows.length}`);
}

export async function resolveAlert(id: string) {
  const session = await requirePublisher("/admin/growth");
  const { error } = await session.supabase.from("operational_alerts").update({ resolved_at: new Date().toISOString() }).eq("id", id);
  if (error) redirect("/admin/growth?error=alert");
  revalidatePath("/admin/growth");
  redirect("/admin/growth");
}
