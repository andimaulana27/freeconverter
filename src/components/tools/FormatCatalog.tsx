"use client";

import Link from "next/link";
import { useState } from "react";
import { FORMAT_CATALOG, formatCatalogCount } from "@/data/format-catalog";
import { cn } from "@/lib/cn";

type Props = {
  onPickFormat: (format: string, category: string) => void;
};

const CATEGORY_TONES: Record<string, string> = {
  Dokumen: "border-[#f0dfc8] bg-[#fff1dc] text-[#c86b0a]",
  Gambar: "border-[#d8e9fb] bg-[#e8f3ff] text-[#1677df]",
  Video: "border-[#f3dfc8] bg-[#fff0dc] text-[#d87512]",
  Audio: "border-[#f2d8e6] bg-[#ffe8f3] text-[#ca3d85]",
  Spreadsheet: "border-[#d4ecdd] bg-[#e5f7ec] text-[#16885c]",
  Presentasi: "border-[#f3ddd2] bg-[#fff0e8] text-[#dd6425]",
  "E-book": "border-[#e2daf7] bg-[#efe9ff] text-[#7248c7]",
  Arsip: "border-[#d4ecea] bg-[#e6f7f6] text-[#128b88]",
  Vektor: "border-[#f2d8e6] bg-[#ffe8f3] text-[#ca3d85]",
  CAD: "border-[#dbe1e9] bg-[#e8edf5] text-[#53657e]",
  Font: "border-[#e3daf8] bg-[#f1eaff] text-[#7948da]",
};

function CategoryIcon({ category, active }: { category: string; active: boolean }) {
  const icon = (() => {
    switch (category) {
      case "Gambar":
        return <><rect x="3" y="4" width="14" height="12" rx="2" /><circle cx="7" cy="8" r="1.5" /><path d="m5 14 3.5-3.5 2.5 2 2-2 2 3.5" /></>;
      case "Video":
        return <><rect x="3" y="4" width="14" height="12" rx="2" /><path d="m8.5 7.5 4.5 2.5-4.5 2.5z" /></>;
      case "Audio":
        return <><path d="M9 15V6l7-2v9" /><circle cx="6.5" cy="15" r="2.5" /><circle cx="13.5" cy="13" r="2.5" /></>;
      case "Spreadsheet":
        return <><rect x="3" y="3" width="14" height="14" rx="2" /><path d="M3 8h14M8 3v14M13 3v14" /></>;
      case "Presentasi":
        return <><rect x="3" y="3" width="14" height="11" rx="2" /><path d="M7 17h6M10 14v3M7 10l2-2 2 1 3-3" /></>;
      case "E-book":
        return <><path d="M3.5 4.5c2.5-.8 4.6-.3 6.5 1.2v10c-1.9-1.5-4-2-6.5-1.2zM16.5 4.5c-2.5-.8-4.6-.3-6.5 1.2v10c1.9-1.5 4-2 6.5-1.2z" /></>;
      case "Arsip":
        return <><path d="M4 6h12v11H4zM3 3h14v3H3z" /><path d="M9 9h2M9 12h2" /></>;
      case "Vektor":
        return <><circle cx="5" cy="5" r="1.5" /><circle cx="15" cy="5" r="1.5" /><circle cx="10" cy="15" r="1.5" /><path d="M6.5 5h7M5.8 6.3l3.4 7.4M14.2 6.3l-3.4 7.4" /></>;
      case "CAD":
        return <><path d="m10 2.5 7 4v7l-7 4-7-4v-7zM3 6.5l7 4 7-4M10 10.5v7" /></>;
      case "Font":
        return <><path d="m5 16 5-12 5 12M7 12h6" /></>;
      default:
        return <><path d="M5 2.5h6l4 4v11H5zM11 2.5v4h4M8 11h4M8 14h3" /></>;
    }
  })();

  return (
    <span className={cn(
      "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition duration-180",
      active ? "border-white/10 bg-white/10 text-white" : CATEGORY_TONES[category],
    )}>
      <svg viewBox="0 0 20 20" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {icon}
      </svg>
    </span>
  );
}

function FileIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
      <path d="M4 1.5h5l3 3v10H4zM9 1.5v3h3" strokeLinejoin="round" />
    </svg>
  );
}

function RouteIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 7h10m-3-3 3 3-3 3M17 13H7m3-3-3 3 3 3" />
    </svg>
  );
}

export function FormatCatalog({ onPickFormat }: Props) {
  const [active, setActive] = useState(FORMAT_CATALOG[0].category);
  const group = FORMAT_CATALOG.find((item) => item.category === active) ?? FORMAT_CATALOG[0];

  return (
    <section className="group/formats relative isolate overflow-hidden rounded-panel border border-[#ded7d3] bg-white p-6 shadow-panel sm:p-8">
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-45 [background-image:linear-gradient(rgba(24,20,18,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(24,20,18,0.03)_1px,transparent_1px)] [background-size:40px_40px]"
        aria-hidden
      />
      <div className="pointer-events-none absolute -left-20 -bottom-24 -z-10 h-64 w-64 rounded-full border-[42px] border-[#f3efed] transition duration-700 group-hover/formats:scale-110" aria-hidden />

      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-eyebrow font-bold uppercase text-accent">Format catalog</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-ink">
            {formatCatalogCount} formats across {FORMAT_CATALOG.length} categories
          </h2>
        </div>
        <p className="max-w-sm text-sm leading-6 text-mute">
          Browse the same format families as a full converter, then open a focused tool on this site.
        </p>
      </div>

      <div className="relative mt-6 grid grid-cols-2 gap-1 overflow-hidden rounded-card border border-[#ebe5e1] bg-[#faf8f7] p-1.5 sm:grid-cols-3 md:grid-cols-6" aria-label="Format categories">
        {FORMAT_CATALOG.map((item) => (
          <button
            key={item.category}
            type="button"
            onClick={() => setActive(item.category)}
            aria-pressed={item.category === active}
            className={cn(
              "inline-flex h-9 w-full min-w-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-control px-2 text-[11px] font-semibold transition duration-180 sm:h-10 sm:px-2.5 sm:text-xs",
              item.category === active
                ? "bg-ink text-white shadow-[0_8px_18px_rgba(24,20,18,0.16)]"
                : "text-mute hover:bg-white hover:text-ink",
            )}
          >
            <CategoryIcon category={item.category} active={item.category === active} />
            {item.label}
            <span className={cn("font-mono text-[10px]", item.category === active ? "text-white/60" : "text-faint")}>
              {item.formats.length}
            </span>
          </button>
        ))}
      </div>

      <div className="relative mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-micro font-bold uppercase text-faint">{group.label} formats</p>
            <p className="text-micro font-bold uppercase text-faint">{group.formats.length} listed</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {group.formats.map((format) => (
              <button
                key={format}
                type="button"
                onClick={() => onPickFormat(format, group.category)}
                className="group/format inline-flex items-center gap-2 rounded-control border border-[#ebe5e1] bg-white px-2.5 py-2 font-mono text-[11px] font-semibold uppercase text-ink shadow-drop transition duration-180 hover:-translate-y-0.5 hover:border-ink hover:bg-ink hover:text-white"
              >
                <span className="text-faint transition group-hover/format:text-white/60"><FileIcon /></span>
                {format}
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-card border border-[#e7e1de] bg-[#faf8f7] p-4">
          <p className="text-micro font-bold uppercase text-faint">Common conversions</p>
          <ul className="mt-3 space-y-3">
            {group.common.map((item) => (
              <li key={item.slug}>
                <Link href={`/${item.slug}`} className="group flex items-center gap-3 rounded-control border border-transparent px-2 py-2 transition duration-180 hover:border-[#e7e1de] hover:bg-white hover:shadow-drop">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control border border-[#eadfdb] bg-accent-soft text-accent transition duration-180 group-hover:bg-accent group-hover:text-white">
                    <RouteIcon />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-mono text-xs font-semibold uppercase text-ink transition group-hover:text-accent">
                      {item.from} → {item.to}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-mute">{item.note}</span>
                  </span>
                  <span className="text-faint transition duration-180 group-hover:translate-x-0.5 group-hover:text-accent">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
