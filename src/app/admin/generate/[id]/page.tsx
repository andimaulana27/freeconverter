import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { AdminChrome } from "@/app/admin/AdminChrome";
import { BatchMonitor } from "@/components/cms/BatchMonitor";
import { BatchStatusBadge } from "@/components/cms/GenerationStatusBadge";
import { TitleReview } from "@/components/cms/TitleReview";
import { ButtonLink } from "@/components/ui/Button";
import { fetchBatch, listJobsForBatch, listMediaJobsForBatch, loadWorkerSettings } from "@/lib/ai/server";
import { kickGenerationWorker } from "@/lib/ai/worker";
import { ARTICLE_TYPE_LABELS } from "@/lib/ai/types";
import { canPublish } from "@/lib/auth/roles";
import { requireCms } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Generation batch",
  robots: { index: false, follow: false },
};

export const maxDuration = 300;

type Props = { params: Promise<{ id: string }> };

export default async function GenerationBatchPage({ params }: Props) {
  const { id } = await params;
  const session = await requireCms(`/admin/generate/${id}`);
  const [batch, jobs, mediaJobs, settings] = await Promise.all([
    fetchBatch(session.supabase, id),
    listJobsForBatch(session.supabase, id),
    listMediaJobsForBatch(session.supabase, id),
    loadWorkerSettings(session.supabase),
  ]);
  if (!batch) notFound();

  const active =
    batch.status === "running" ||
    jobs.some((job) => job.status === "pending" || job.status === "running") ||
    mediaJobs.some((job) => job.status === "pending" || job.status === "running");
  if (active) {
    after(() => {
      void kickGenerationWorker();
    });
  }

  const selectedIndexes =
    batch.progress.selectedIndexes?.length
      ? batch.progress.selectedIndexes
      : typeof batch.progress.selectedIndex === "number"
        ? [batch.progress.selectedIndex]
        : [];

  return (
    <AdminChrome email={session.email} role={session.role} currentAal={session.currentAal}>
      <div className="flex flex-wrap items-end justify-between gap-5 rounded-[22px] border border-black/[0.07] bg-white p-6 shadow-tile">
        <div>
          <p className="flex items-center gap-2 font-mono text-micro font-bold uppercase text-accent">
            <span className="h-px w-6 bg-accent" />
            Draft run
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.055em]">{batch.topic}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <BatchStatusBadge status={batch.status} />
            <span className="text-xs text-mute">{ARTICLE_TYPE_LABELS[batch.article_type]}</span>
            <span className="text-faint">·</span>
            <span className="text-xs text-mute">
              {jobs.length ? `${jobs.length} independent job${jobs.length === 1 ? "" : "s"}` : "Choose titles, then queue drafts"}
            </span>
          </div>
        </div>
        <ButtonLink href="/admin/generate" variant="secondary" size="sm">
          ← All draft runs
        </ButtonLink>
      </div>

      <div className="mt-6">
        <TitleReview
          batchId={batch.id}
          initialTitles={batch.progress.titles ?? []}
          includeIllustration={batch.progress.includeIllustration === true}
          initialSelectedIndexes={selectedIndexes}
          publishingMode={batch.publishing_mode}
          canSchedule={canPublish(session.role)}
          autoPublishEnabled={settings.autoPublishEnabled}
          queueLocked={jobs.length > 0}
        />
      </div>

      <BatchMonitor batchId={batch.id} jobs={jobs} mediaJobs={mediaJobs} active={active} />
    </AdminChrome>
  );
}
