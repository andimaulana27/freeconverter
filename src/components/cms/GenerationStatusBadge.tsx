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
  running: "Creating draft",
  completed: "Completed",
  partial: "Completed with issues",
  failed: "Needs attention",
  cancelled: "Cancelled",
};

const JOB_LABEL: Record<GenerationJobStatus, string> = {
  pending: "Waiting",
  running: "Writing",
  completed: "Draft ready",
  failed: "Could not finish",
  cancelled: "Cancelled",
};

const BATCH_HELP: Record<GenerationBatchStatus, string> = {
  pending: "Title ideas are ready and waiting for your selection.",
  running: "The selected guide is being prepared.",
  completed: "The requested draft was created successfully.",
  partial: "Some work finished, but at least one step needs review.",
  failed: "The run stopped before a usable draft was created.",
  cancelled: "This run was stopped and will not continue.",
};

export function BatchStatusBadge({ status }: { status: GenerationBatchStatus }) {
  return <span title={BATCH_HELP[status]}><Badge tone={BATCH_TONE[status]}>{BATCH_LABEL[status]}</Badge></span>;
}

export function JobStatusBadge({ status }: { status: GenerationJobStatus }) {
  return <Badge tone={JOB_TONE[status]}>{JOB_LABEL[status]}</Badge>;
}
