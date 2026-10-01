"use client";

import Link from "next/link";
import { useState } from "react";
import { FORMAT_CATALOG, formatCatalogCount } from "@/data/format-catalog";
import { cn } from "@/lib/cn";

type Props = {
  onPickFormat: (format: string, category: string) => void;
};

export function FormatCatalog({ onPickFormat }: Props) {
  const [active, setActive] = useState(FORMAT_CATALOG[0].category);
  const group = FORMAT_CATALOG.find((item) => item.category === active) ?? FORMAT_CATALOG[0];

  return (
    <section className="rounded-[28px] border border-[#e5dfdc] bg-white p-5 sm:p-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent">Format catalog</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-ink">
            {formatCatalogCount} formats across {FORMAT_CATALOG.length} categories
          </h2>
        </div>
        <p className="max-w-sm text-sm leading-6 text-mute">
          Browse the same format families as a full converter, then open a focused tool on this site.
        </p>
      </div>

      <div className="mt-6 flex gap-1 overflow-x-auto pb-1" aria-label="Format categories">
        {FORMAT_CATALOG.map((item) => (
          <button
            key={item.category}
            type="button"
            onClick={() => setActive(item.category)}
            aria-pressed={item.category === active}
            className={cn(
              "h-10 shrink-0 rounded-xl px-3 text-xs font-semibold transition",
              item.category === active ? "bg-ink text-white" : "text-mute hover:bg-[#f7f5f3] hover:text-ink",
            )}
          >
            {item.label}
            <span className={cn("ml-2 font-mono text-[10px]", item.category === active ? "text-white/60" : "text-faint")}>
              {item.formats.length}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_240px]">
        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-faint">{group.label} formats</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-faint">{group.formats.length} listed</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {group.formats.map((format) => (
              <button
                key={format}
                type="button"
                onClick={() => onPickFormat(format, group.category)}
                className="rounded-lg bg-[#f4f1ef] px-2.5 py-1.5 font-mono text-[11px] font-semibold uppercase text-ink transition hover:bg-ink hover:text-white"
              >
                {format}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-faint">Common conversions</p>
          <ul className="mt-3 space-y-3">
            {group.common.map((item) => (
              <li key={item.slug}>
                <Link href={`/${item.slug}`} className="group block">
                  <p className="font-mono text-xs font-semibold uppercase text-ink transition group-hover:text-accent">
                    {item.from} → {item.to}
                  </p>
                  <p className="mt-0.5 text-[11px] text-mute">{item.note}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
