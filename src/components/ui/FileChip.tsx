"use client";

import { Button } from "@/components/ui/Button";
import { formatBytes } from "@/lib/file";

type Props = {
  name: string;
  size: number;
  onRemove?: () => void;
};

export function FileChip({ name, size, onRemove }: Props) {
  return (
    <li className="flex min-w-0 items-center gap-2 rounded-control border border-line bg-bone px-3 py-2 text-sm animate-enter">
      <span className="min-w-0 flex-1 truncate font-medium text-ink">{name}</span>
      <span className="shrink-0 text-xs text-faint">{formatBytes(size)}</span>
      {onRemove ? (
        <Button type="button" variant="ghost" size="sm" className="h-7 w-7 px-0" onClick={onRemove} aria-label={`Remove ${name}`}>
          ×
        </Button>
      ) : null}
    </li>
  );
}
