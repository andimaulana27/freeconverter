import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminChrome } from "@/app/admin/AdminChrome";
import { BatchStatusBadge, JobStatusBadge } from "@/components/cms/GenerationStatusBadge";
import { TitleReview } from "@/components/cms/TitleReview";
import { ButtonLink } from "@/components/ui/Button";
import { fetchBatch, listJobsForBatch } from "@/lib/ai/server";
import { ARTICLE_TYPE_LABELS, type GenerationJobStage } from "@/lib/ai/types";
import { requireCms } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Generation batch",
  robots: { index: false, follow: false },
};

export const maxDuration = 300;

type Props = { params: Promise<{ id: string }> };

const STAGE_LABELS: Record<GenerationJobStage, string> = {
  queued: "Waiting to start",
  brief: "Understanding the topic",
  outline: "Planning the guide",
  draft: "Writing the article",
  seo: "Preparing search details",
  validation: "Checking quality",
  review: "Final review",
  saved: "Saved as a private draft",
};

export default async function GenerationBatchPage({ params }: Props) {
  const { id } = await params;
  const session = await requireCms(`/admin/generate/${id}`);
  const [batch, jobs] = await Promise.all([fetchBatch(session.supabase, id), listJobsForBatch(session.supabase, id)]);
  if (!batch) notFound();

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
            <span className="text-xs text-mute">Always saved privately for your review</span>
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
          jobs={jobs}
        />
      </div>

      {jobs.length ? (
        <section className="mt-6 rounded-[22px] border border-black/[0.07] bg-white p-6 shadow-tile">
          <p className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-accent">Draft progress</p>
          <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em]">What the assistant created</h2>
          <ul className="mt-4 space-y-3">
            {jobs.map((job, index) => (
              <li key={job.id} className="rounded-[18px] border border-black/[0.07] bg-[#faf8f7] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white font-mono text-[9px] text-accent shadow-drop">0{index + 1}</span>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{job.title}</p>
                      <p className="mt-1 text-xs text-mute">{STAGE_LABELS[job.stage]}</p>
                    </div>
                  </div>
                  <JobStatusBadge status={job.status} />
                </div>
                {job.error ? <p className="mt-3 rounded-xl border border-accent/20 bg-accent-soft px-3 py-2 text-sm text-accent-ink">The draft could not finish: {job.error}</p> : null}
                {job.post_id ? (
                  <p className="mt-3">
                    <ButtonLink href={`/admin/posts/${job.post_id}`} variant="primary" size="sm">Open and edit draft →</ButtonLink>
                  </p>
                ) : null}
                {job.token_usage.steps.length ? (
                  <details className="group/details mt-3 border-t border-line pt-3">
                    <summary className="flex cursor-pointer list-none items-center justify-between text-[10px] font-semibold text-faint">
                      Technical details
                      <span className="text-accent transition group-open/details:rotate-45">+</span>
                    </summary>
                    <p className="mt-2 break-words font-mono text-[9px] leading-5 text-faint">
                      Models: {job.token_usage.steps.map((step) => `${step.task}: ${step.modelId}`).join(" · ")} · Total tokens:{" "}
                      {job.token_usage.steps.reduce((sum, step) => sum + step.totalTokens, 0)} · Attempts: {job.attempts}
                    </p>
                  </details>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </AdminChrome>
  );
}
