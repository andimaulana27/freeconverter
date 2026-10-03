import type { Metadata } from "next";
import Link from "next/link";
import { AdminChrome } from "@/app/admin/AdminChrome";
import { DailyCadenceForm } from "@/components/cms/DailyCadenceForm";
import { GenerateForm } from "@/components/cms/GenerateForm";
import { BatchStatusBadge } from "@/components/cms/GenerationStatusBadge";
import { ProviderHealthCard } from "@/components/cms/ProviderHealthCard";
import { readGenerationHealth } from "@/lib/ai/secrets";
import { listEditorialSlots, loadDailyCadence } from "@/lib/ai/daily-bot";
import { listRecentBatches } from "@/lib/ai/server";
import { ARTICLE_TYPE_LABELS } from "@/lib/ai/types";
import { canManageSecrets, canPublish } from "@/lib/auth/roles";
import { requireCms } from "@/lib/auth/session";
import { zonedDateKey, zonedSlotToUtc } from "@/lib/blog/cadence";
import { tools } from "@/lib/tools";

export const metadata: Metadata = {
  title: "Generate",
  robots: { index: false, follow: false },
};

export const maxDuration = 300;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(value));
}

export default async function GenerateAdminPage() {
  const session = await requireCms("/admin/generate");
  const [health, batches, cadence] = await Promise.all([
    readGenerationHealth(session.supabase, session.role),
    listRecentBatches(session.supabase),
    loadDailyCadence(session.supabase),
  ]);
  const superAdmin = canManageSecrets(session.role);
  const today = zonedDateKey(new Date(), cadence.timezone);
  const planned = await listEditorialSlots(session.supabase, today, cadence.timezone);
  const plannedByTime = new Map(planned.map((slot) => [slot.time, slot]));
  const slots = cadence.times.map((time) => {
    return (
      plannedByTime.get(time) ?? {
        time,
        status: "waiting",
        toolSlug: null,
        error: null,
        runAt: zonedSlotToUtc(today, time, cadence.timezone).toISOString(),
      }
    );
  });

  return (
    <AdminChrome email={session.email} role={session.role} currentAal={session.currentAal}>
      <div className="flex flex-wrap items-end justify-between gap-5 rounded-[22px] border border-black/[0.07] bg-white p-6 shadow-tile">
        <div>
          <p className="flex items-center gap-2 font-mono text-micro font-bold uppercase text-accent">
            <span className="h-px w-6 bg-accent" />
            AI drafting
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.055em]">AI draft assistant</h1>
          <p className="mt-2 max-w-2xl text-sm text-mute">
            The daily bot writes and schedules guides on its own. Change how many go out, and at which times. Manual drafts stay below when you want a specific topic.
          </p>
        </div>
      </div>

      {superAdmin ? (
        <div className="mt-5">
          <ProviderHealthCard health={health} />
        </div>
      ) : (
        <p className="mt-5 text-sm text-mute">
          {health.configured
            ? health.disabled
              ? "The writing assistant is temporarily unavailable. Ask an administrator to reconnect it."
              : "The writing assistant is ready. Private access details are never shown here."
            : "The writing assistant has not been connected yet. Ask an administrator to finish setup."}
        </p>
      )}

      <div className="mt-6">
        <DailyCadenceForm
          enabled={cadence.enabled}
          count={cadence.count}
          times={cadence.times}
          timezone={cadence.timezone}
          canEdit={canPublish(session.role)}
          slots={slots}
        />
      </div>

      <div className="mt-6">
        <GenerateForm
          configured={health.configured}
          disabled={health.disabled}
          healthLabel={health.configured ? "AI assistant ready · every result stays private until you publish it" : "AI assistant setup is incomplete"}
          tools={tools.map((tool) => ({ slug: tool.slug, title: tool.title, category: tool.category }))}
        />
      </div>

      <section className="mt-7">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-accent">Recent activity</p>
            <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em]">Past draft runs</h2>
            <p className="mt-1 text-sm text-mute">Reopen a previous topic to review titles, job progress, or saved drafts.</p>
          </div>
        </div>
        {batches.length ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {batches.map((batch) => (
              <Link key={batch.id} href={`/admin/generate/${batch.id}`} className="group rounded-[18px] border border-black/[0.07] bg-white p-5 shadow-drop outline-none transition duration-280 hover:-translate-y-0.5 hover:border-black/15 hover:shadow-tile focus-visible:ring-2 focus-visible:ring-accent">
                <div className="flex items-start justify-between gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#f4efed] text-accent transition group-hover:bg-accent group-hover:text-white">
                    <SparkIcon />
                  </span>
                  <BatchStatusBadge status={batch.status} />
                </div>
                <h3 className="mt-5 line-clamp-2 text-sm font-semibold leading-5">{batch.topic}</h3>
                <p className="mt-2 text-xs text-mute">{ARTICLE_TYPE_LABELS[batch.article_type]}</p>
                <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                  <span className="text-[10px] text-faint" title={`Stored in UTC · ${batch.updated_at}`}>{formatDate(batch.updated_at)}</span>
                  <span className="text-[10px] font-semibold text-accent transition group-hover:translate-x-0.5">Open →</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-[22px] border border-dashed border-[#d9d0cb] bg-white px-6 py-12 text-center">
            <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-accent-soft text-accent"><SparkIcon /></span>
            <p className="mt-4 text-sm font-semibold">No draft runs yet</p>
            <p className="mt-2 text-xs text-mute">Complete the form above to generate your first set of title ideas.</p>
          </div>
        )}
      </section>
    </AdminChrome>
  );
}

function SparkIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M10 2.5c.55 3.1 1.8 4.35 5 5-3.2.65-4.45 1.9-5 5-.55-3.1-1.8-4.35-5-5 3.2-.65 4.45-1.9 5-5Z" strokeLinejoin="round" />
      <path d="M15.5 12.5c.25 1.4.85 2 2.25 2.25-1.4.3-2 .85-2.25 2.25-.3-1.4-.85-1.95-2.25-2.25 1.4-.25 1.95-.85 2.25-2.25Z" strokeLinejoin="round" />
    </svg>
  );
}
