"use client";

import { FormatGlyph } from "@/components/convert/FormatArtwork";
import { cn } from "@/lib/cn";
import type { OutputOption } from "@/lib/convert/workspace";

export type { OutputOption };

type Props = {
  options: OutputOption[];
  current?: string;
  onSelect?: (tool: OutputOption) => void;
  title?: string;
  description?: string;
};

function SelectedIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
      <path d="m3.5 8 2.7 2.7 6.3-6.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function OutputSwitch({
  options,
  current,
  onSelect,
  title = "Output format",
  description = "Choose the finished file type.",
}: Props) {
  if (options.length < 2) return null;
  return (
    <div className="mt-5 overflow-hidden rounded-card border border-[#e5dfdc] bg-[#faf8f7] p-4 sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-accent">{title}</p>
          <p className="mt-1 text-[11px] leading-5 text-mute">{description}</p>
        </div>
        <span className="rounded-full border border-[#ded7d3] bg-white px-2.5 py-1 font-mono text-[8px] font-semibold uppercase tracking-[0.12em] text-faint">
          {options.length} formats
        </span>
      </div>
      <div
        role="radiogroup"
        aria-label={title}
        className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8"
      >
        {options.map((item) => {
          const active = item.output === current || item.slug === current;
          const className = cn(
            "group/output relative flex flex-col items-center gap-1.5 rounded-xl border px-2 py-2.5 text-center transition duration-180",
            active
              ? "border-accent bg-white text-accent shadow-[0_8px_22px_rgba(217,45,40,0.10)]"
              : "border-[#e4dedb] bg-white text-mute hover:-translate-y-0.5 hover:border-[#c8bdb8] hover:text-ink hover:shadow-drop",
          );
          const content = (
            <>
              <FormatGlyph
                format={item.output}
                category={item.category}
                className={cn(
                  "h-8 w-8 rounded-lg transition duration-180",
                  active
                    ? "border-accent/25 bg-accent-soft text-accent"
                    : "border-[#e8e1dd] bg-[#faf8f7] group-hover/output:bg-white",
                )}
              />
              <span className="font-mono text-[10px] font-bold tracking-wide">{item.output.toUpperCase()}</span>
              {active ? (
                <span className="absolute right-1.5 top-1.5 grid h-3.5 w-3.5 place-items-center rounded-full bg-accent text-white">
                  <SelectedIcon />
                </span>
              ) : null}
            </>
          );
          return (
            <button
              key={item.slug}
              type="button"
              role="radio"
              aria-checked={active}
              className={className}
              onClick={() => onSelect?.(item)}
            >
              {content}
            </button>
          );
        })}
      </div>
    </div>
  );
}

type JobPick = { id: string; label: string };

export function JobPicks({ label, value, options, onChange }: { label: string; value: string; options: JobPick[]; onChange: (id: string) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-faint">{label}</p>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
        {options.map((item) => {
          const active = item.id === value;
          return (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={active}
              className={cn(
                "rounded-lg border px-3 py-2 font-mono text-xs tracking-wide transition duration-180",
                active
                  ? "border-accent bg-accent-soft text-accent"
                  : "border-[#e4dedb] bg-white text-mute hover:border-[#c8bdb8] hover:text-ink",
              )}
              onClick={() => onChange(item.id)}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
