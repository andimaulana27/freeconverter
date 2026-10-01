import type { Metadata } from "next";
import Link from "next/link";
import { DropEngine } from "@/components/convert/DropEngine";
import { AdSlot } from "@/components/layout/AdSlot";
import { JsonLd } from "@/components/seo/JsonLd";
import { ToolIcon } from "@/components/tools/ToolIcon";
import { ToolGroups } from "@/components/tools/ToolGroups";
import { homeMetadata, websiteJsonLd } from "@/lib/seo";
import { getTool, tools, type ToolDef } from "@/lib/tools";

export const metadata: Metadata = homeMetadata();

const CATEGORY_LINKS = [
  { slug: "image-compressor", label: "Images", note: "Convert & edit" },
  { slug: "merge-pdf", label: "PDF", note: "Organize documents" },
  { slug: "docx-to-pdf", label: "Documents", note: "Office workflows" },
  { slug: "xlsx-to-csv", label: "Sheets", note: "Excel & CSV" },
  { slug: "pptx-to-pdf", label: "Slides", note: "Presentations" },
  { slug: "epub-to-pdf", label: "E-books", note: "Readers & comics" },
  { slug: "rar-to-zip", label: "Archives", note: "ZIP, RAR, 7Z" },
  { slug: "ttf-to-woff2", label: "Fonts", note: "Ready for the web" },
] as const;

const FAQS = [
  ["Are my files uploaded?", "Most image, PDF, font, and utility tools run locally in your browser. The tool page always tells you when a dedicated worker is required."],
  ["Is AllYouConvert really free?", "Yes. You can use the available browser tools without an account, subscription, or hidden watermark."],
  ["Which formats are supported?", "The catalog covers 200+ formats across images, PDF, documents, sheets, slides, ebooks, archives, vector, CAD, fonts, video, and audio. Browser-ready tools run locally. Worker-backed formats stay listed honestly until that converter is online."],
  ["Can I use it on mobile?", "Yes. The upload area, format controls, and downloads are designed for phones, tablets, and desktop browsers."],
] as const;

function ArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M3 10h13m-5-5 5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function HomePage() {
  const categories = CATEGORY_LINKS.map((item) => ({
    ...item,
    tool: getTool(item.slug) as ToolDef,
  }));

  return (
    <div className="flex flex-col gap-20 pb-8 sm:gap-28">
      <JsonLd data={websiteJsonLd()} />

      <section className="grid items-center gap-12 border-b border-[#e7e1de] pb-14 lg:grid-cols-[0.95fr_1.05fr] lg:gap-14 lg:pb-20">
        <div className="relative">
          <p className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.22em] text-[#6f6763]">
            <span className="h-px w-8 bg-accent" />
            Browser file studio
          </p>
          <h1 className="mt-7 text-5xl font-semibold leading-[0.94] tracking-[-0.065em] text-ink sm:text-7xl lg:text-[70px]">
            Make every file
            <span className="block text-accent">work harder.</span>
          </h1>
          <p className="mt-7 max-w-md text-base leading-7 text-mute">
            Convert, compress, and edit everyday files in a workspace built for speed—not sign-ups, limits, or unnecessary steps.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#converter"
              className="group inline-flex items-center gap-3 rounded-xl bg-ink px-5 py-3.5 text-sm font-semibold text-white transition duration-180 hover:-translate-y-0.5 hover:bg-accent"
            >
              Convert a file
              <span className="transition group-hover:translate-x-1"><ArrowIcon /></span>
            </a>
            <a
              href="#tools"
              className="inline-flex items-center rounded-xl border border-[#dcd5d1] bg-white px-5 py-3.5 text-sm font-semibold text-ink transition hover:border-[#bdb3ae] hover:bg-[#f8f5f3]"
            >
              Explore all tools
            </a>
          </div>
          <dl className="mt-10 grid max-w-md grid-cols-3 border-t border-[#e5dfdc] pt-5">
            {[
              [String(tools.length), "tools"],
              ["0", "sign-ups"],
              ["Local", "processing"],
            ].map(([value, label]) => (
              <div key={label}>
                <dt className="text-lg font-semibold tracking-tight text-ink">{value}</dt>
                <dd className="mt-0.5 text-[10px] uppercase tracking-[0.13em] text-faint">{label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div id="converter" className="relative scroll-mt-24">
          <div className="absolute -right-5 -top-5 h-24 w-24 rounded-[28px] bg-[#ffd74a]" aria-hidden />
          <div className="absolute -bottom-5 -left-5 h-32 w-32 rounded-full bg-[#8b6cff]" aria-hidden />
          <div className="relative overflow-hidden rounded-[28px] border border-[#dfd8d4] bg-white shadow-[0_30px_80px_rgba(45,30,24,0.15)]">
            <div className="flex items-center justify-between border-b border-[#eee9e6] bg-[#191513] px-5 py-3.5 text-white">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em]">Quick converter</p>
              <p className="flex items-center gap-2 text-[10px] text-white/55">
                <span className="h-1.5 w-1.5 rounded-full bg-[#55d69a]" />
                Ready
              </p>
            </div>
            <DropEngine />
          </div>
        </div>
      </section>

      <section aria-label="Tool categories">
        <div className="grid overflow-hidden rounded-2xl border border-[#e6e0dd] bg-[#e6e0dd] sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((item, index) => (
            <Link
              key={item.slug}
              href={`/#${item.tool.category.toLowerCase()}`}
              className="group flex items-center gap-3 bg-white p-4 transition hover:bg-[#faf7f5]"
            >
              <ToolIcon tool={item.tool} index={index + 1} />
              <span>
                <span className="block text-sm font-semibold text-ink">{item.label}</span>
                <span className="mt-0.5 block text-[11px] text-faint">{item.note}</span>
              </span>
              <span className="ml-auto text-faint transition group-hover:translate-x-1 group-hover:text-ink"><ArrowIcon /></span>
            </Link>
          ))}
        </div>
      </section>

      <ToolGroups initialLimit={4} popularLimit={8} />

      <section className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="flex min-h-[420px] flex-col justify-between overflow-hidden rounded-[28px] bg-[#181412] p-7 text-white sm:p-10">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#ff8c87]">A clearer workflow</p>
            <h2 className="mt-4 max-w-sm text-4xl font-semibold leading-[1.05] tracking-[-0.05em] sm:text-5xl">
              From file to finished in three moves.
            </h2>
          </div>
          <div className="relative mt-16 flex items-end gap-2" aria-hidden>
            {["PDF", "JPG", "WEBP"].map((format, index) => (
              <span
                key={format}
                className={`flex h-28 w-24 items-end rounded-2xl border border-white/15 p-3 text-[10px] font-bold tracking-[0.16em] ${
                  index === 1 ? "-translate-y-6 rotate-3 bg-accent" : "bg-white/5"
                }`}
              >
                {format}
              </span>
            ))}
          </div>
        </div>
        <div className="grid gap-px overflow-hidden rounded-[28px] border border-[#e5dfdc] bg-[#e5dfdc]">
          {[
            ["01", "Drop it", "Choose a file or drag it straight into the workspace."],
            ["02", "Shape it", "Pick the output and adjust only the settings that matter."],
            ["03", "Take it", "Download the finished file and keep moving."],
          ].map(([number, title, copy]) => (
            <div key={number} className="group grid gap-4 bg-white p-6 transition hover:bg-[#fff8f7] sm:grid-cols-[64px_1fr] sm:p-8">
              <span className="font-mono text-xs text-accent">{number}</span>
              <div>
                <h3 className="text-xl font-semibold tracking-tight text-ink">{title}</h3>
                <p className="mt-2 max-w-md text-sm leading-6 text-mute">{copy}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <AdSlot />

      <section className="grid gap-10 border-y border-[#e5dfdc] py-14 lg:grid-cols-2 lg:gap-20 lg:py-20">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">Private by design</p>
          <h2 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-[-0.05em] sm:text-5xl">
            Your files should stay yours.
          </h2>
        </div>
        <div>
          <p className="text-base leading-7 text-mute">
            Browser-based tools keep common conversions on your device. That means less waiting, fewer transfers, and a workflow that feels immediate.
          </p>
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {["No account required", "No hidden watermark", "Clear output choices", "Works across devices"].map((item) => (
              <p key={item} className="flex items-center gap-3 rounded-xl bg-white p-3 text-xs font-semibold text-ink">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#e7f8ef] text-[#16885c]">✓</span>
                {item}
              </p>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">Good to know</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-ink">Questions, answered.</h2>
        </div>
        <div className="divide-y divide-[#e5dfdc] border-y border-[#e5dfdc]">
          {FAQS.map(([question, answer]) => (
            <details key={question} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-ink">
                {question}
                <span className="text-lg text-faint transition group-open:rotate-45">+</span>
              </summary>
              <p className="max-w-2xl pt-3 text-sm leading-6 text-mute">{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden rounded-[28px] bg-accent px-7 py-10 text-white sm:px-10 sm:py-12">
        <div className="absolute -right-14 -top-24 h-64 w-64 rounded-full border-[42px] border-white/10" aria-hidden />
        <div className="relative flex flex-col justify-between gap-8 sm:flex-row sm:items-end">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white">One less thing to worry about</p>
            <h2 className="mt-3 max-w-xl text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
              Your next file is ready when you are.
            </h2>
          </div>
          <a href="#converter" className="group inline-flex w-fit items-center gap-3 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:bg-[#fff1f0]">
            Start converting
            <span className="transition group-hover:translate-x-1"><ArrowIcon /></span>
          </a>
        </div>
      </section>
    </div>
  );
}
