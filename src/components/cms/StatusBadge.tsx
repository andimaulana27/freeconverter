import { Badge } from "@/components/ui/Badge";
import type { PostStatus } from "@/lib/cms/types";

const LABELS: Record<PostStatus, string> = {
  draft: "Draft",
  review: "In review",
  scheduled: "Scheduled",
  published: "Published",
  archived: "Archived",
};

const TONES: Record<PostStatus, "mute" | "warn" | "accent" | "ok"> = {
  draft: "mute",
  review: "warn",
  scheduled: "accent",
  published: "ok",
  archived: "mute",
};

export function statusLabel(status: PostStatus) {
  return LABELS[status];
}

export function StatusBadge({ status }: { status: PostStatus }) {
  return <Badge tone={TONES[status]}>{LABELS[status]}</Badge>;
}
