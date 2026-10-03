import { Badge } from "@/components/ui/Badge";
import type { GenerationBatchStatus, GenerationJobStatus } from "@/lib/ai/types";

const BATCH_TONE: Record<GenerationBatchStatus, "mute" | "warn" | "accent" | "ok"> = {
  pending: "warn",
  running: "accent",
  completed: "ok",
  partial: "warn",
  failed: "accent",
  cancelled: "mute",
};

const JOB_TONE: Record<GenerationJobStatus, "mute" | "warn" | "accent" | "ok"> = {
  pending: "mute",
  running: "accent",
  completed: "ok",
  failed: "accent",
  cancelled: "mute",
};

const BATCH_LABEL: Record<GenerationBatchStatus, string> = {
  pending: "Ready to start",
  running: "Creating drafts",
  completed: "Completed",
  partial: "Completed with issues",
  failed: "Needs attention",
  cancelled: "Cancelled",
};

const JOB_LABEL: Record<GenerationJobStatus, string> = {
  pending: "Queued",
  running: "Writing",
  completed: "Draft ready",
  failed: "Could not finish",
  cancelled: "Cancelled",
};

const BATCH_HELP: Record<GenerationBatchStatus, string> = {
  pending: "Title ideas are ready. Queue selected drafts when you are satisfied.",
  running: "Independent jobs are writing drafts in the background.",
  completed: "Every queued draft was created successfully.",
  partial: "Some drafts finished, but at least one article or illustration needs review.",
  failed: "The run stopped before usable drafts were created.",
  cancelled: "This run was stopped and remaining jobs will not continue.",
};

export function BatchStatusBadge({ status }: { status: GenerationBatchStatus }) {
  return <span title={BATCH_HELP[status]}><Badge tone={BATCH_TONE[status]}>{BATCH_LABEL[status]}</Badge></span>;
}

export function JobStatusBadge({ status }: { status: GenerationJobStatus }) {
  return <Badge tone={JOB_TONE[status]}>{JOB_LABEL[status]}</Badge>;
}
