import { Badge } from "@/components/ui/Badge";
import type { AdCreativeStatus } from "@/lib/ads/types";

const LABELS: Record<AdCreativeStatus, string> = {
  draft: "Draft",
  active: "Active",
  paused: "Paused",
  archived: "Archived",
};

const TONES: Record<AdCreativeStatus, "mute" | "warn" | "accent" | "ok"> = {
  draft: "mute",
  active: "ok",
  paused: "warn",
  archived: "mute",
};

export function AdStatusBadge({ status }: { status: AdCreativeStatus }) {
  return <Badge tone={TONES[status]}>{LABELS[status]}</Badge>;
}
