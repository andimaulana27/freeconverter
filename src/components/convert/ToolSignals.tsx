import type { ToolNeed } from "@/lib/tools";
import { cn } from "@/lib/cn";

type Props = {
  need: ToolNeed;
  hasAlternatives: boolean;
  compact?: boolean;
};

const iconClass = "h-4 w-4 shrink-0 text-accent transition duration-180 group-hover:scale-110";

export function ToolSignals({ need, hasAlternatives, compact = false }: Props) {
  const local = need === "browser";

  return (
    <ul className={cn("mt-2 grid gap-px overflow-hidden rounded-2xl border border-line bg-line", !compact && "sm:grid-cols-3")}>
      <li className="group flex items-center gap-3 bg-paper p-3 text-xs text-mute transition duration-180 hover:text-ink">
        <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
          <path d="M12 3.5 19 6v5.5c0 4.4-2.8 7.4-7 9-4.2-1.6-7-4.6-7-9V6z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
        <span>{local ? "Stays on device" : "Private worker"}</span>
      </li>
      <li className="group flex items-center gap-3 bg-paper p-3 text-xs text-mute transition duration-180 hover:text-ink">
        <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
          <path d="m13 2-8 12h6l-1 8 9-13h-6z" />
        </svg>
        <span>{local ? "No queue" : "Queued safely"}</span>
      </li>
      <li className="group flex items-center gap-3 bg-paper p-3 text-xs text-mute transition duration-180 hover:text-ink">
        <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
          <path d="M7 7h10l-2.5-2.5M17 17H7l2.5 2.5M17 7l-2.5 2.5M7 17l2.5-2.5" />
        </svg>
        <span>{hasAlternatives ? "Switch output" : "Focused tool"}</span>
      </li>
    </ul>
  );
}
