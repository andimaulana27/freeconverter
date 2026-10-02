import type { ToolNeed } from "@/lib/tools";

type Props = {
  need: ToolNeed;
  hasAlternatives: boolean;
};

const iconClass = "h-4 w-4 text-accent transition duration-180 group-hover:scale-110";

export function ToolSignals({ need, hasAlternatives }: Props) {
  const local = need === "browser";

  return (
    <div className="h-full overflow-hidden rounded-tile border border-[#dfd8d4] bg-white shadow-tile">
      <div className="flex items-center justify-between border-b border-[#eee9e6] px-5 py-4">
        <p className="text-eyebrow font-bold uppercase text-ink">Route benefits</p>
        <span className="font-mono text-micro uppercase text-faint">{local ? "Local workflow" : "Worker workflow"}</span>
      </div>
      <ul className="divide-y divide-[#eee9e6] px-5">
        <li className="group flex items-center gap-3 py-4 text-xs text-mute transition duration-180 hover:text-ink">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#e7f8ef]">
            <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
              <path d="M12 3.5 19 6v5.5c0 4.4-2.8 7.4-7 9-4.2-1.6-7-4.6-7-9V6z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </span>
          <span>{local ? "Stays on device" : "Private worker"}</span>
        </li>
        <li className="group flex items-center gap-3 py-4 text-xs text-mute transition duration-180 hover:text-ink">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent-soft">
            <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
              <path d="m13 2-8 12h6l-1 8 9-13h-6z" />
            </svg>
          </span>
          <span>{local ? "No queue" : "Queued safely"}</span>
        </li>
        <li className="group flex items-center gap-3 py-4 text-xs text-mute transition duration-180 hover:text-ink">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#f3f0ee]">
            <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
              <path d="M7 7h10l-2.5-2.5M17 17H7l2.5 2.5M17 7l-2.5 2.5M7 17l2.5-2.5" />
            </svg>
          </span>
          <span>{hasAlternatives ? "Switch output" : "Focused tool"}</span>
        </li>
      </ul>
    </div>
  );
}
