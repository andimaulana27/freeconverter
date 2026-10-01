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
    <li className="flex min-w-0 items-center gap-2 border-b border-line py-2.5 text-sm animate-chip">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
      <span className="min-w-0 flex-1 truncate font-medium text-ink">{name}</span>
      <span className="shrink-0 font-mono text-xs text-faint">{formatBytes(size)}</span>
      {onRemove ? (
        <Button type="button" variant="ghost" size="sm" className="h-7 w-7 px-0" onClick={onRemove} aria-label={`Remove ${name}`}>
          ×
        </Button>
      ) : null}
    </li>
  );
}
