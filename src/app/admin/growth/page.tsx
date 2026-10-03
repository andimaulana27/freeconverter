import type { Metadata } from "next";
import Link from "next/link";
import { AdminChrome } from "@/app/admin/AdminChrome";
import { ingestSearchConsoleCsv, resolveAlert } from "@/app/admin/growth/actions";
import { Button } from "@/components/ui/Button";
import { canManageSecrets, canPublish, canUseCms } from "@/lib/auth/roles";
import { requireStaff } from "@/lib/auth/session";
import { listOpenAlerts, listRecentQualityReports } from "@/lib/cms/editorial-server";
import { growthRecommendations, listMetricsSince } from "@/lib/cms/metrics";

export const metadata: Metadata = {
  title: "Growth and quality",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ ingested?: string; error?: string }> };

export default async function GrowthPage({ searchParams }: Props) {
  const session = await requireStaff("/admin/growth");
  const params = await searchParams;
  if (!canUseCms(session.role) && !canManageSecrets(session.role)) {
    return (
      <AdminChrome email={session.email} role={session.role} currentAal={session.currentAal}>
        <p className="text-sm text-mute">This role cannot view editorial growth metrics.</p>
      </AdminChrome>
    );
  }

  const [metrics, alerts, reports] = await Promise.all([
    listMetricsSince(session.supabase, 14),
    listOpenAlerts(session.supabase),
    listRecentQualityReports(session.supabase),
  ]);
  const totals = new Map<string, number>();
  for (const row of metrics) totals.set(row.metric_key, (totals.get(row.metric_key) ?? 0) + row.value);
  const notes = growthRecommendations(metrics);

  return (
    <AdminChrome email={session.email} role={session.role} currentAal={session.currentAal}>
      <section className="rounded-[26px] border border-black/[0.07] bg-white p-6 shadow-tile sm:p-8">
        <p className="font-mono text-micro font-bold uppercase text-accent">Phase 7</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em]">Quality and growth</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-mute">
          Counts are page-level and day-bucketed. No reader identifiers, queries, or file names are stored. Use Search Console aggregates only as page totals.
        </p>
        {params.ingested ? (
          <p className="mt-3 text-sm text-ok">Imported {params.ingested} Search Console page rows.</p>
        ) : null}
        {params.error === "csv" ? (
          <p className="mt-3 text-sm text-warn">Paste page-level CSV with path, date, impressions, and clicks.</p>
        ) : null}
        {params.error === "forbidden" ? (
          <p className="mt-3 text-sm text-warn">Only super admins can ingest Search Console aggregates.</p>
        ) : null}
        {params.error === "alert" ? (
          <p className="mt-3 text-sm text-warn">That alert could not be resolved.</p>
        ) : null}
        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard label="Guide views" value={totals.get("guide_view") ?? 0} />
          <MetricCard label="Guide tool clicks" value={totals.get("guide_tool_click") ?? 0} />
          <MetricCard label="Converter starts" value={totals.get("tool_start") ?? 0} />
          <MetricCard label="GSC impressions" value={totals.get("gsc_impressions") ?? 0} />
          <MetricCard label="GSC clicks" value={totals.get("gsc_clicks") ?? 0} />
        </div>
      </section>

      <section className="mt-5 rounded-[22px] border border-black/[0.07] bg-white p-5 shadow-tile sm:p-6">
        <h2 className="text-lg font-semibold tracking-[-0.03em]">Cadence notes</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-mute">
          {notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </section>

      {canManageSecrets(session.role) ? (
        <section className="mt-5 rounded-[22px] border border-black/[0.07] bg-white p-5 shadow-tile sm:p-6">
          <h2 className="text-lg font-semibold tracking-[-0.03em]">Search Console ingest</h2>
          <p className="mt-1 text-xs text-mute">Paste page, date, impressions, clicks. Query strings are ignored.</p>
          <form
            action={async (formData) => {
              "use server";
              await ingestSearchConsoleCsv(formData);
            }}
            className="mt-4 space-y-3"
          >
            <textarea name="csv" rows={6} className="w-full rounded-xl border border-line bg-[#faf7f5] p-3 font-mono text-xs" placeholder="page,date,impressions,clicks" />
            <Button type="submit" size="sm">Import aggregates</Button>
          </form>
        </section>
      ) : null}

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <section className="rounded-[22px] border border-black/[0.07] bg-white p-5 shadow-tile">
          <h2 className="text-lg font-semibold tracking-[-0.03em]">Open alerts</h2>
          {alerts.length ? (
            <ul className="mt-3 divide-y divide-line">
              {alerts.map((alert) => (
                <li key={alert.id} className="flex items-start justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm font-semibold">{alert.kind.replaceAll("_", " ")}</p>
                    <p className="mt-1 text-xs text-mute">{alert.message}</p>
                  </div>
                  {canPublish(session.role) ? (
                    <form action={async () => { "use server"; await resolveAlert(alert.id); }}>
                      <Button type="submit" variant="secondary" size="sm">Resolve</Button>
                    </form>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-mute">No open publishing or quality alerts.</p>
          )}
        </section>
        <section className="rounded-[22px] border border-black/[0.07] bg-white p-5 shadow-tile">
          <h2 className="text-lg font-semibold tracking-[-0.03em]">Recent quality scans</h2>
          {reports.length ? (
            <ul className="mt-3 space-y-2">
              {reports.map((row) => (
                <li key={row.id}>
                  <Link href={`/admin/posts/${row.post_id}`} className="flex items-center justify-between rounded-xl bg-[#f7f4f2] px-3 py-2 text-sm">
                    <span>Score {row.score}</span>
                    <span className="font-mono text-[9px] text-faint">{row.blocking_count} holds · {row.warning_count} warnings</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-mute">Run a quality scan from a guide editor.</p>
          )}
        </section>
      </div>
    </AdminChrome>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-2xl border border-black/[0.07] bg-[#f7f4f2] p-4">
      <p className="font-mono text-[9px] font-bold uppercase tracking-[0.13em] text-faint">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-[-0.04em]">{value}</p>
      <p className="mt-1 text-[10px] text-faint">Last 14 days</p>
    </article>
  );
}
