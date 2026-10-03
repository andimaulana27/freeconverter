"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cancelBatchAction, kickGenerationWorkerAction, retryJobAction, retryMediaJobAction } from "@/app/admin/generate/actions";
import { JobStatusBadge } from "@/components/cms/GenerationStatusBadge";
import { Button, ButtonLink } from "@/components/ui/Button";
import type { GenerationJob, GenerationJobStage, GenerationMediaJob } from "@/lib/ai/types";

const STAGE_LABELS: Record<GenerationJobStage, string> = {
  queued: "Waiting in the queue",
  brief: "Understanding the topic",
  outline: "Planning the guide",
  draft: "Writing the article",
  seo: "Preparing search details",
  validation: "Checking quality",
  review: "Saving the draft",
  saved: "Saved as a private draft",
};

function mediaLabel(job: GenerationMediaJob) {
  if (job.status === "completed") return "Illustration ready";
  if (job.status === "failed") return "Illustration needs retry";
  if (job.status === "cancelled") return "Illustration cancelled";
  if (job.status === "running") return "Generating illustration";
  return "Illustration queued";
}

export function BatchMonitor({
  batchId,
  jobs,
  mediaJobs,
  active,
}: {
  batchId: string;
  jobs: GenerationJob[];
  mediaJobs: GenerationMediaJob[];
  active: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!active) return;
    const refresh = window.setInterval(() => {
      router.refresh();
    }, 4000);
    const kick = window.setInterval(() => {
      void kickGenerationWorkerAction();
    }, 12000);
    void kickGenerationWorkerAction();
    return () => {
      window.clearInterval(refresh);
      window.clearInterval(kick);
    };
  }, [active, router]);

  async function onCancel() {
    setError("");
    setBusy("cancel");
    const result = await cancelBatchAction({ batchId });
    setBusy(null);
    if (!result.ok) setError(result.error);
    else router.refresh();
  }

  async function onRetry(jobId: string) {
    setError("");
    setBusy(jobId);
    const result = await retryJobAction({ jobId, batchId });
    setBusy(null);
    if (!result.ok) setError(result.error);
    else router.refresh();
  }

  async function onRetryMedia(mediaJobId: string) {
    setError("");
    setBusy(mediaJobId);
    const result = await retryMediaJobAction({ mediaJobId, batchId });
    setBusy(null);
    if (!result.ok) setError(result.error);
    else router.refresh();
  }

  if (!jobs.length) return null;

  const completed = jobs.filter((job) => job.status === "completed").length;
  const failed = jobs.filter((job) => job.status === "failed").length;

  return (
    <section className="mt-6 rounded-[22px] border border-black/[0.07] bg-white p-6 shadow-tile">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-accent">Draft progress</p>
          <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em]">Independent jobs</h2>
          <p className="mt-1 text-sm text-mute">
            {completed} saved · {failed} need attention · {jobs.length} total. Closing this page does not stop the queue.
          </p>
        </div>
        {active ? (
          <Button type="button" variant="danger" size="sm" loading={busy === "cancel"} onClick={() => void onCancel()}>
            Cancel remaining
          </Button>
        ) : null}
      </div>

      {active ? (
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-bone" aria-hidden>
          <div className="h-full bg-accent transition-all" style={{ width: `${Math.round((completed / Math.max(jobs.length, 1)) * 100)}%` }} />
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="mt-4 rounded-control border border-accent/30 bg-accent-soft px-3 py-2 text-sm text-accent-ink">
          {error}
        </p>
      ) : null}

      <ul className="mt-4 space-y-3">
        {jobs.map((job, index) => {
          const media = mediaJobs.filter((item) => item.generation_job_id === job.id);
          return (
            <li key={job.id} className="rounded-[18px] border border-black/[0.07] bg-[#faf8f7] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white font-mono text-[9px] text-accent shadow-drop">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{job.title}</p>
                    <p className="mt-1 text-xs text-mute">{STAGE_LABELS[job.stage]} · attempt {job.attempts}/{job.max_attempts}</p>
                  </div>
                </div>
                <JobStatusBadge status={job.status} />
              </div>
              {job.error ? <p className="mt-3 rounded-xl border border-accent/20 bg-accent-soft px-3 py-2 text-sm text-accent-ink">{job.error}</p> : null}
              <div className="mt-3 flex flex-wrap gap-2">
                {job.post_id ? (
                  <ButtonLink href={`/admin/posts/${job.post_id}`} variant="primary" size="sm">
                    Open draft
                  </ButtonLink>
                ) : null}
                {job.status === "failed" ? (
                  <Button type="button" variant="secondary" size="sm" loading={busy === job.id} onClick={() => void onRetry(job.id)}>
                    Retry article
                  </Button>
                ) : null}
              </div>
              {media.map((item) => (
                <div key={item.id} className="mt-3 rounded-xl border border-line bg-white px-3 py-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs text-mute">{mediaLabel(item)}</p>
                    <JobStatusBadge status={item.status} />
                  </div>
                  {item.error ? <p className="mt-2 text-xs text-accent-ink">{item.error}</p> : null}
                  {item.status === "failed" ? (
                    <Button type="button" variant="secondary" size="sm" className="mt-2" loading={busy === item.id} onClick={() => void onRetryMedia(item.id)}>
                      Retry illustration
                    </Button>
                  ) : null}
                </div>
              ))}
              {job.token_usage.steps.length ? (
                <details className="group/details mt-3 border-t border-line pt-3">
                  <summary className="flex cursor-pointer list-none items-center justify-between text-[10px] font-semibold text-faint">
                    Technical details
                    <span className="text-accent transition group-open/details:rotate-45">+</span>
                  </summary>
                  <p className="mt-2 break-words font-mono text-[9px] leading-5 text-faint">
                    Models: {job.token_usage.steps.map((step) => `${step.task}: ${step.modelId}`).join(" · ")} · Tokens:{" "}
                    {job.token_usage.steps.reduce((sum, step) => sum + step.totalTokens, 0)}
                  </p>
                </details>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
