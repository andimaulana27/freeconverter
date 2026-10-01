"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AdSlot } from "@/components/layout/AdSlot";
import { FormatCatalog } from "@/components/tools/FormatCatalog";
import { ToolIcon } from "@/components/tools/ToolIcon";
import { cn } from "@/lib/cn";
import { sourceKey, toolBlurb, tools, type ToolDef } from "@/lib/tools";

const GROUPS = [
  "Semua",
  "Gambar",
  "PDF",
  "Dokumen",
  "Spreadsheet",
  "Presentasi",
  "E-book",
  "Arsip",
  "Vektor",
  "CAD",
  "Font",
  "Video",
  "Audio",
  "Utilitas",
] as const;
const GROUP_LABELS: Record<(typeof GROUPS)[number], string> = {
  Semua: "All",
  Gambar: "Images",
  PDF: "PDF",
  Dokumen: "Docs",
  Spreadsheet: "Sheets",
  Presentasi: "Slides",
  "E-book": "E-books",
  Arsip: "Archives",
  Vektor: "Vector",
  CAD: "CAD",
  Font: "Fonts",
  Video: "Video",
  Audio: "Audio",
  Utilitas: "Utilities",
};

const GROUP_META: Record<string, { description: string; tone: string; mark: string }> = {
  Gambar: {
    description: "Convert, compress, and edit images, including camera RAW.",
    tone: "bg-[#eaf4ff] text-[#0c5fae]",
    mark: "bg-[#1677df]",
  },
  PDF: {
    description: "Merge, split, arrange, and convert PDF documents.",
    tone: "bg-[#ffe9e8] text-[#b92521]",
    mark: "bg-[#df3732]",
  },
  Dokumen: {
    description: "Convert Word, OpenDocument, Pages, and other text files.",
    tone: "bg-[#e8f4ff] text-[#1a6fbf]",
    mark: "bg-[#1a6fbf]",
  },
  Spreadsheet: {
    description: "Move workbooks between Excel, CSV, Numbers, and PDF.",
    tone: "bg-[#e5f7ec] text-[#16885c]",
    mark: "bg-[#16885c]",
  },
  Presentasi: {
    description: "Convert PowerPoint, Keynote, and OpenDocument slides.",
    tone: "bg-[#fff0e8] text-[#dd6425]",
    mark: "bg-[#dd6425]",
  },
  "E-book": {
    description: "Convert EPUB, Kindle, MOBI, and comic archives.",
    tone: "bg-[#efe9ff] text-[#7248c7]",
    mark: "bg-[#7248c7]",
  },
  Arsip: {
    description: "Repack ZIP, RAR, 7Z, TAR, and other archives.",
    tone: "bg-[#e6f7f6] text-[#128b88]",
    mark: "bg-[#128b88]",
  },
  Vektor: {
    description: "Convert Illustrator, EPS, CorelDRAW, and SVG artwork.",
    tone: "bg-[#ffe8f3] text-[#ca3d85]",
    mark: "bg-[#ca3d85]",
  },
  CAD: {
    description: "Exchange DWG, DXF, and 3D CAD drawings.",
    tone: "bg-[#e8edf5] text-[#53657e]",
    mark: "bg-[#53657e]",
  },
  Font: {
    description: "Prepare lightweight fonts that are ready for the web.",
    tone: "bg-[#f1eaff] text-[#7948da]",
    mark: "bg-[#7948da]",
  },
  Utilitas: {
    description: "Small, useful tools for everyday technical work.",
    tone: "bg-[#e7f8ef] text-[#16885c]",
    mark: "bg-[#16885c]",
  },
  Video: {
    description: "Convert and compress video in one focused workspace.",
    tone: "bg-[#fff0dc] text-[#d87512]",
    mark: "bg-[#d87512]",
  },
  Audio: {
    description: "Extract and convert audio with a simple workflow.",
    tone: "bg-[#ffe8f3] text-[#ca3d85]",
    mark: "bg-[#ca3d85]",
  },
};

const POPULAR = [
  "image-compressor",
  "png-to-jpg",
  "jpg-to-pdf",
  "merge-pdf",
  "split-pdf",
  "pdf-to-jpg",
  "docx-to-pdf",
  "xlsx-to-csv",
  "image-resizer",
  "unit-converter",
];

const TOOL_INDEX = new Map(tools.map((tool, index) => [tool.slug, index]));

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" strokeLinecap="round" />
    </svg>
  );
}

function ToolLink({ tool }: { tool: ToolDef }) {
  const index = TOOL_INDEX.get(tool.slug) ?? 0;
  return (
    <Link
      href={`/${tool.slug}`}
      className="group relative isolate flex min-h-[124px] flex-col overflow-hidden rounded-2xl border border-[#e7e1de] bg-white p-4 shadow-[0_8px_30px_rgba(32,22,18,0.035)] transition duration-280 hover:-translate-y-1 hover:border-[#d7cdc8] hover:shadow-[0_16px_34px_rgba(32,22,18,0.09)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
    >
      <span className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-accent transition-transform duration-280 group-hover:scale-x-100" aria-hidden />
      <span className="absolute -right-10 -top-10 -z-10 h-24 w-24 rounded-full bg-accent-soft/0 transition duration-500 group-hover:bg-accent-soft/70" aria-hidden />
      <div className="flex items-start justify-between gap-3">
        <ToolIcon tool={tool} index={index} />
        <svg
          viewBox="0 0 20 20"
          className="h-4 w-4 translate-x-[-4px] text-[#c9c1bd] opacity-0 transition duration-280 group-hover:translate-x-0 group-hover:text-ink group-hover:opacity-100"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          aria-hidden
        >
          <path d="M4 10h11m-4-4 4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h3 className="mt-3 text-sm font-semibold tracking-[-0.01em] text-ink">{tool.title}</h3>
      <p className="mt-1 line-clamp-2 text-[11px] leading-[1.55] text-mute">{toolBlurb(tool)}</p>
      {tool.need === "vps" ? (
        <span className="mt-3 w-fit rounded-full bg-[#fff4df] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-[#a35e08]">
          Coming soon
        </span>
      ) : null}
    </Link>
  );
}

export function ToolGroups({
  showIntro = true,
  initialLimit = 8,
  popularLimit = 8,
}: {
  showIntro?: boolean;
  initialLimit?: number;
  popularLimit?: number;
}) {
  const [active, setActive] = useState<(typeof GROUPS)[number]>("Semua");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const normalizedQuery = query.trim().toLowerCase();
  const visibleTools = useMemo(
    () =>
      tools.filter((tool) => {
        const inGroup = active === "Semua" || tool.category === active;
        const matches =
          !normalizedQuery ||
          `${tool.title} ${tool.purpose} ${tool.category} ${tool.slug} ${tool.inputs.join(" ")} ${tool.inputs.map(sourceKey).join(" ")} ${tool.output}`
            .toLowerCase()
            .includes(normalizedQuery) ||
          `${tool.title} ${tool.slug} ${tool.inputs.join(" ")} ${tool.output}`
            .toLowerCase()
            .includes(sourceKey(normalizedQuery));
        return inGroup && matches;
      }),
    [active, normalizedQuery],
  );

  const visibleGroups = GROUPS.slice(1).filter(
    (group) => active === "Semua" || active === group,
  );
  const popular = POPULAR.map((slug) => tools.find((tool) => tool.slug === slug))
    .filter((tool): tool is ToolDef => Boolean(tool))
    .slice(0, popularLimit);

  return (
    <section id="tools" className="scroll-mt-24">
      {showIntro ? (
        <div className="group/library relative isolate overflow-hidden rounded-[30px] border border-[#ded7d3] bg-white p-6 shadow-[0_24px_70px_rgba(44,30,24,0.065)] sm:p-9 lg:p-11">
          <div
            className="pointer-events-none absolute inset-0 -z-10 opacity-55 [background-image:linear-gradient(rgba(24,20,18,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(24,20,18,0.035)_1px,transparent_1px)] [background-size:40px_40px]"
            aria-hidden
          />
          <div className="pointer-events-none absolute -right-28 -top-28 -z-10 h-80 w-80 rounded-full border-[52px] border-[#f2eeec] transition duration-700 group-hover/library:scale-110" aria-hidden />

          <div className="relative grid items-end gap-9 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <p className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-accent">
                <span className="h-px w-7 bg-accent" />
                Tool library
              </p>
              <h2 className="mt-4 max-w-2xl text-4xl font-semibold leading-[1.02] tracking-[-0.05em] text-ink sm:text-5xl">
                {tools.length} tools.<br />One focused route.
              </h2>
              <p className="mt-5 max-w-xl text-sm leading-6 text-mute sm:text-base">
                Search a format, choose the exact job, and open a workspace built for that result—without digging through a generic editor.
              </p>
            </div>

            <div className="relative overflow-hidden rounded-[22px] border border-[#2e2926] bg-[#181412] p-5 text-white shadow-[0_18px_45px_rgba(35,24,20,0.2)]">
              <div
                className="pointer-events-none absolute inset-0 opacity-25 [background-image:radial-gradient(circle,rgba(255,255,255,0.18)_1px,transparent_1.2px)] [background-size:10px_10px]"
                aria-hidden
              />
              <div className="relative flex items-center justify-between border-b border-white/10 pb-4">
                <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-white/35">Library index</p>
                <span className="flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.14em] text-[#75e0b1]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#55d69a]" />
                  Ready
                </span>
              </div>
              <div className="relative mt-4 grid grid-cols-3 gap-2">
                {[
                  ["01", "Search", "Name or format"],
                  ["02", "Filter", `${GROUPS.length - 1} categories`],
                  ["03", "Launch", "Focused desk"],
                ].map(([number, title, note]) => (
                  <div key={number} className="group/index rounded-xl border border-white/10 bg-white/[0.05] p-3 transition duration-280 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.08]">
                    <span className="font-mono text-[8px] text-[#ff7771]">{number}</span>
                    <p className="mt-4 text-[10px] font-semibold text-white/80">{title}</p>
                    <p className="mt-1 text-[8px] leading-3 text-white/30">{note}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className={cn("sticky top-[76px] z-30 overflow-hidden rounded-2xl border border-white/10 bg-[#181412]/95 p-2.5 shadow-[0_16px_45px_rgba(34,23,18,0.18)] backdrop-blur-xl", showIntro && "mt-5")}>
        <div className="flex flex-col gap-2 lg:flex-row">
          <label className="relative flex min-w-0 flex-1 items-center">
            <span className="pointer-events-none absolute left-3.5 text-[#8f8782]">
              <SearchIcon />
            </span>
            <span className="sr-only">Search tools</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search tools or formats, like PDF to JPG..."
              className="h-11 w-full rounded-xl border border-white/10 bg-white pl-11 pr-4 text-sm text-ink outline-none transition placeholder:text-[#aaa29e] focus:ring-2 focus:ring-accent/40"
            />
          </label>
          <div className="flex gap-1 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] lg:pb-0 [&::-webkit-scrollbar]:hidden" aria-label="Filter by category">
            {GROUPS.map((group) => (
              <button
                key={group}
                type="button"
                onClick={() => setActive(group)}
                aria-pressed={active === group}
                className={cn(
                  "h-11 shrink-0 rounded-xl px-3.5 text-xs font-semibold transition duration-180",
                  active === group
                    ? "bg-accent text-white shadow-[0_8px_18px_rgba(217,45,40,0.22)]"
                    : "text-white/50 hover:bg-white/[0.08] hover:text-white",
                )}
              >
                {GROUP_LABELS[group]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {!showIntro ? (
        <div className="mt-10">
          <FormatCatalog
            onPickFormat={(format) => {
              setQuery(format);
              setActive("Semua");
            }}
          />
        </div>
      ) : null}

      {!normalizedQuery && active === "Semua" ? (
        <div className="mt-10">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6f6763]">Most used</p>
              <h3 className="mt-1 text-xl font-semibold tracking-tight text-ink">Popular shortcuts</h3>
            </div>
            <span className="hidden text-xs text-faint sm:block">Local processing · no sign-up</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {popular.map((tool) => <ToolLink key={tool.slug} tool={tool} />)}
          </div>
          <AdSlot className="mt-10" />
        </div>
      ) : null}

      <div className="mt-12 space-y-14">
        {visibleGroups.map((group) => {
          const list = visibleTools.filter((tool) => tool.category === group);
          if (!list.length) return null;
          const meta = GROUP_META[group];
          const isExpanded = expanded[group] || normalizedQuery.length > 0 || active !== "Semua";
          const shown = isExpanded ? list : list.slice(0, initialLimit);

          return (
            <div key={group} id={group.toLowerCase()} className="scroll-mt-40">
              <div className="mb-5 flex items-start gap-3">
                <span className={cn("mt-1 h-10 w-1 rounded-full", meta.mark)} aria-hidden />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-semibold tracking-tight text-ink">{GROUP_LABELS[group]}</h3>
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", meta.tone)}>
                      {list.length}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-mute">{meta.description}</p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {shown.map((tool) => <ToolLink key={tool.slug} tool={tool} />)}
              </div>
              {!isExpanded && list.length > shown.length ? (
                <button
                  type="button"
                  onClick={() => setExpanded((value) => ({ ...value, [group]: true }))}
                  className="mt-4 rounded-xl border border-[#e8e3e0] bg-white px-4 py-2.5 text-xs font-semibold text-ink transition hover:border-[#cfc6c1] hover:bg-[#faf8f7]"
                >
                  Show {list.length - shown.length} more tools
                </button>
              ) : null}
            </div>
          );
        })}
      </div>

      {visibleTools.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-[#ddd6d2] bg-white/60 px-6 py-14 text-center">
          <p className="font-semibold text-ink">No matching tools found.</p>
          <p className="mt-1 text-sm text-mute">Try another keyword or switch to “All”.</p>
        </div>
      ) : null}
    </section>
  );
}
