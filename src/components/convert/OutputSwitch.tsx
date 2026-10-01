"use client";

import Link from "next/link";
import { FormatGlyph } from "@/components/convert/FormatArtwork";
import { cn } from "@/lib/cn";
import type { ToolDef } from "@/lib/tools";

type Props = {
  options: ToolDef[];
  current?: string;
  onSelect?: (tool: ToolDef) => void;
};

export function OutputSwitch({ options, current, onSelect }: Props) {
  if (options.length < 2) return null;
  return (
    <div className="mt-5 flex flex-col gap-2">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-faint">Choose output</p>
      <div role="radiogroup" aria-label="Output format" className="flex flex-wrap gap-2">
        {options.map((item) => {
          const active = item.output === current || item.slug === current;
          const className = cn(
            "inline-flex items-center gap-2 rounded-xl border px-3 py-2 font-mono text-xs font-semibold tracking-wide transition duration-180",
            active
              ? "border-accent bg-accent-soft text-accent shadow-sm"
              : "border-[#e4dedb] bg-white text-mute hover:border-[#c8bdb8] hover:text-ink",
          );
          if (onSelect) {
            return (
              <button
                key={item.slug}
                type="button"
                role="radio"
                aria-checked={active}
                className={className}
                onClick={() => onSelect(item)}
              >
                <FormatGlyph format={item.output} category={item.category} />
                {item.output.toUpperCase()}
              </button>
            );
          }
          if (active) {
            return (
              <span key={item.slug} role="radio" aria-checked="true" className={className}>
                <FormatGlyph format={item.output} category={item.category} />
                {item.output.toUpperCase()}
              </span>
            );
          }
          return (
            <Link key={item.slug} href={`/${item.slug}`} role="radio" aria-checked="false" className={className}>
              <FormatGlyph format={item.output} category={item.category} />
              {item.output.toUpperCase()}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

type Pick = { id: string; label: string };

export function JobPicks({ label, value, options, onChange }: { label: string; value: string; options: Pick[]; onChange: (id: string) => void }) {
  return (
    <div className="mt-5 flex flex-col gap-2">
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-faint">{label}</p>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-5">
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
