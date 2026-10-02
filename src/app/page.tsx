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
  {
    label: "Privacy",
    question: "Are my files uploaded?",
    answer: "Most image, PDF, font, and utility tools run locally in your browser. The tool page always tells you when a dedicated worker is required.",
  },
  {
    label: "Pricing",
    question: "Is AllYouConvert really free?",
    answer: "Yes. You can use the available browser tools without an account, subscription, or hidden watermark.",
  },
  {
    label: "Formats",
    question: "Which formats are supported?",
    answer: "The catalog covers 200+ formats across images, PDF, documents, sheets, slides, ebooks, archives, vector, CAD, fonts, video, and audio. Browser-ready tools run locally. Worker-backed formats stay listed honestly until that converter is online.",
  },
  {
    label: "Devices",
    question: "Can I use it on mobile?",
    answer: "Yes. The upload area, format controls, and downloads are designed for phones, tablets, and desktop browsers.",
  },
] as const;

const PRIVACY_POINTS = [
  { number: "01", title: "No account", note: "Start without a sign-up" },
  { number: "02", title: "No watermark", note: "Keep a clean output" },
  { number: "03", title: "Clear choices", note: "See the format before converting" },
  { number: "04", title: "Any device", note: "Built for desktop and mobile" },
] as const;

const HERO_SIGNALS = [
  { value: String(tools.length), title: "purpose-built tools", note: "A focused route for every job" },
  { value: "Zero", title: "account walls", note: "Convert first—no sign-up detour" },
  { value: "Fast", title: "straight-through flow", note: "From file to download in a few clicks" },
] as const;

function ArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M3 10h13m-5-5 5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PrivacyIcon({ index }: { index: number }) {
  const paths = [
    <><circle key="a" cx="10" cy="7" r="3" /><path key="b" d="M4.5 17c.8-3 2.6-4.5 5.5-4.5s4.7 1.5 5.5 4.5" /></>,
    <><path key="a" d="M5 10.5V7a5 5 0 0 1 10 0v3.5" /><rect key="b" x="3.5" y="10.5" width="13" height="7" rx="2" /></>,
    <><path key="a" d="M4 5h12M4 10h12M4 15h12" /><circle key="b" cx="8" cy="5" r="1.5" fill="currentColor" stroke="none" /><circle key="c" cx="13" cy="10" r="1.5" fill="currentColor" stroke="none" /><circle key="d" cx="7" cy="15" r="1.5" fill="currentColor" stroke="none" /></>,
    <><rect key="a" x="3" y="4" width="14" height="10" rx="2" /><path key="b" d="M7 17h6M10 14v3" /></>,
  ];

  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {paths[index]}
    </svg>
  );
}

function HeroSignalIcon({ index }: { index: number }) {
  const paths = [
    <><rect key="a" x="3" y="3" width="5" height="5" rx="1" /><rect key="b" x="12" y="3" width="5" height="5" rx="1" /><rect key="c" x="3" y="12" width="5" height="5" rx="1" /><path key="d" d="M12 14.5h5M14.5 12v5" /></>,
    <><circle key="a" cx="10" cy="7" r="3" /><path key="b" d="M4.5 17c.8-3 2.6-4.5 5.5-4.5 1.3 0 2.4.3 3.3.9M15 13l3 3m0-3-3 3" /></>,
    <><path key="a" d="m11.5 2.5-6 8H10l-1.5 7 6-8H10z" strokeLinejoin="round" /></>,
  ];

  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {paths[index]}
    </svg>
  );
}

function WorkflowIcon({ index }: { index: number }) {
  const paths = [
    <><path key="a" d="M5 2.5h6l4 4v11H5z" /><path key="b" d="M11 2.5v4h4M8 11h4M8 14h3" /></>,
    <><path key="a" d="M3.5 5.5h13M3.5 10h13M3.5 14.5h13" /><circle key="b" cx="8" cy="5.5" r="1.5" fill="currentColor" stroke="none" /><circle key="c" cx="13" cy="10" r="1.5" fill="currentColor" stroke="none" /><circle key="d" cx="7" cy="14.5" r="1.5" fill="currentColor" stroke="none" /></>,
    <><path key="a" d="M10 2.5 17 5v5.4c0 4.2-2.8 6.3-7 7.8-4.2-1.5-7-3.6-7-7.8V5z" /><path key="b" d="m6.8 10.4 2.1 2.1 4.5-4.5" /></>,
  ];

  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {paths[index]}
    </svg>
  );
}

export default function HomePage() {
  const categories = CATEGORY_LINKS.map((item) => ({
    ...item,
    tool: getTool(item.slug) as ToolDef,
  }));

  return (
    <div className="flex flex-col gap-10 sm:gap-12">
      <JsonLd data={websiteJsonLd()} />

      <section className="relative left-1/2 isolate w-[calc(100vw-2rem)] max-w-[1440px] -translate-x-1/2 overflow-hidden rounded-panel bg-[#171311] text-white shadow-panel-dark sm:w-[calc(100vw-3rem)]">
        <div
          className="pointer-events-none absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:48px_48px]"
          aria-hidden
        />
        <div className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full border border-white/10" aria-hidden />
        <div className="pointer-events-none absolute -left-12 top-36 h-48 w-48 rounded-full border border-white/10" aria-hidden />

        <div className="relative p-6 sm:p-10 lg:p-12">
          <div className="grid items-center gap-6 sm:gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-12">
          <div>
            <p className="flex items-center gap-3 text-eyebrow font-bold uppercase text-accent">
              <span className="h-px w-7 bg-accent" />
              Built for everyday files
            </p>
            <h1 className="mt-5 max-w-xl text-[42px] font-semibold leading-[0.97] tracking-[-0.06em] sm:text-6xl sm:leading-[0.95] lg:text-[64px]">
              Drop the file.
              <span className="mt-1 block text-accent">Leave with the format you need.</span>
            </h1>
            <p className="mt-6 max-w-lg text-[15px] leading-7 text-white/65">
              Choose a file, pick an output, and download. A straightforward converter with no account, no subscription, and no unnecessary steps.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#converter"
                className="group inline-flex items-center gap-3 rounded-control bg-accent px-5 py-3.5 text-sm font-semibold text-white shadow-action transition duration-180 hover:-translate-y-0.5 hover:bg-accent-ink"
              >
                Open the workbench
                <span className="transition group-hover:translate-x-1"><ArrowIcon /></span>
              </a>
              <Link
                href="/tools"
                className="inline-flex items-center rounded-control border border-white/15 bg-white/[0.06] px-5 py-3.5 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/10"
              >
                Browse {tools.length} tools
              </Link>
            </div>

            <div className="mt-9">
              <p className="text-micro font-bold uppercase text-white/55">Start with a popular route</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  ["png-to-jpg", "PNG", "JPG"],
                  ["pdf-to-docx", "PDF", "WORD"],
                  ["heic-to-jpg", "HEIC", "JPG"],
                ].map(([slug, from, to]) => (
                  <Link
                    key={slug}
                    href={`/${slug}`}
                    className="group inline-flex items-center gap-2 rounded-control border border-white/10 bg-black/15 px-3 py-2 font-mono text-micro font-semibold text-white/70 transition hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/10 hover:text-white"
                  >
                    {from}
                    <span className="text-accent-light transition group-hover:translate-x-0.5">→</span>
                    {to}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div id="converter" className="group/workbench relative scroll-mt-24">
            <div
              className="pointer-events-none absolute -inset-16 bg-[radial-gradient(circle,rgba(217,45,40,0.2),transparent_62%)] opacity-60 blur-2xl transition duration-700 group-hover/workbench:opacity-90"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-0 translate-x-2 translate-y-2 rounded-[34px] border border-white/[0.08] bg-white/[0.025] transition duration-500"
              aria-hidden
            />

            <div className="relative overflow-hidden rounded-panel border border-white/15 bg-white/[0.07] p-2 shadow-panel-dark backdrop-blur-md transition duration-500 group-hover/workbench:border-white/25">
              <div className="flex items-center justify-between gap-4 px-3 py-3 text-white sm:px-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent shadow-[0_8px_22px_rgba(217,45,40,0.35)]">
                    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                      <path d="M10 3v10m0 0 4-4m-4 4L6 9M4 16h12" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[10px] font-bold uppercase tracking-[0.18em] text-white/80">Instant workbench</span>
                    <span className="mt-0.5 block truncate text-micro normal-case tracking-normal text-white/50">One file. One clean route.</span>
                  </span>
                </div>
                <span className="flex shrink-0 items-center gap-2 rounded-full border border-[#75e0b1]/20 bg-[#75e0b1]/10 px-3 py-1.5 font-mono text-micro font-semibold uppercase text-[#8be8bd]">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-[#75e0b1]/70 motion-safe:animate-ping" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#75e0b1]" />
                  </span>
                  Local &amp; private
                </span>
              </div>

              <div className="overflow-hidden rounded-tile bg-white p-1 shadow-tile [&>div>span:nth-child(-n+4)]:hidden">
                <DropEngine variant="hero" />
              </div>

              <div className="relative flex items-center justify-between gap-3 px-3 py-3 sm:px-4">
                <div className="flex items-center gap-2">
                  {["Choose", "Convert", "Download"].map((label, index) => (
                    <span key={label} className="flex items-center gap-2">
                      <span className={`grid h-5 w-5 place-items-center rounded-full border font-mono text-micro ${index === 0 ? "border-accent bg-accent text-white" : "border-white/15 bg-white/[0.04] text-white/50"}`}>
                        {index + 1}
                      </span>
                      <span className="hidden text-micro font-semibold uppercase text-white/50 sm:inline">{label}</span>
                      {index < 2 ? <span className="hidden h-px w-5 bg-white/10 sm:block" /> : null}
                    </span>
                  ))}
                </div>
                <span className="font-mono text-micro uppercase text-white/45">No sign-up</span>
              </div>
            </div>

          </div>
        </div>

          <dl className="relative mt-6 grid overflow-hidden rounded-2xl border border-white/10 bg-black/20 sm:mt-10 sm:grid-cols-3 lg:mt-12">
            {HERO_SIGNALS.map((item, index) => (
              <div
                key={item.title}
                className="group/signal relative border-t border-white/10 p-4 transition duration-280 first:border-t-0 hover:bg-white/[0.06] sm:border-l sm:border-t-0 sm:p-5 sm:first:border-l-0"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-accent-light transition duration-280 group-hover/signal:-translate-y-0.5 group-hover/signal:rotate-3 group-hover/signal:border-accent-light/35">
                    <HeroSignalIcon index={index} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-lg font-semibold tracking-tight text-white">{item.value}</dt>
                      <span className="font-mono text-micro text-white/35">0{index + 1}</span>
                    </div>
                    <dd>
                      <span className="mt-1 block text-micro font-bold uppercase tracking-[0.12em] text-white/60">{item.title}</span>
                      <span className="mt-1.5 block text-[12px] leading-5 text-white/45">{item.note}</span>
                    </dd>
                  </div>
                </div>
              </div>
            ))}
          </dl>
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

      <ToolGroups compact initialLimit={4} popularLimit={4} />

      <section className="group/workflow relative isolate overflow-hidden rounded-panel border border-white/10 bg-[#181412] p-6 text-white shadow-panel-dark sm:p-8 lg:p-10">
        <div
          className="pointer-events-none absolute inset-0 -z-10 opacity-35 [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:44px_44px]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 -z-10 w-[32rem] opacity-30 [background-image:radial-gradient(circle,rgba(255,106,100,0.55)_1px,transparent_1.2px)] [background-size:11px_11px] [mask-image:linear-gradient(to_left,black,transparent)]"
          aria-hidden
        />
        <div className="pointer-events-none absolute -right-24 -top-28 -z-10 h-72 w-72 rounded-full border-[42px] border-white/[0.035] transition duration-700 group-hover/workflow:scale-110" aria-hidden />

        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="flex items-center gap-3 text-eyebrow font-bold uppercase text-accent">
              <span className="h-px w-7 bg-accent" />
              A clearer workflow
            </p>
            <h2 className="mt-4 max-w-2xl text-4xl font-semibold leading-[1.02] tracking-[-0.05em] sm:text-5xl">
              One straight line from file to finished.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-6 text-white/50">
              No maze of settings. Make the three choices that matter, then keep moving.
            </p>
          </div>
          <div className="flex w-fit items-center gap-3 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2.5 font-mono text-micro uppercase text-white/55">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-[#55d69a]/60 motion-safe:animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#55d69a]" />
            </span>
            Three moves / zero detours
          </div>
        </div>

        <div className="relative mt-8 grid gap-4 lg:grid-cols-3">
          <div className="pointer-events-none absolute left-[16%] right-[16%] top-9 hidden h-px border-t border-dashed border-white/15 lg:block" aria-hidden>
            <span className="absolute left-0 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-accent-light shadow-[0_0_0_5px_rgba(255,106,100,0.1)] motion-safe:animate-[privacy-route_3.4s_ease-in-out_infinite]" />
          </div>
          {[
            ["Drop it", "Choose a file or drag it straight into the conversion desk.", "Input ready"],
            ["Shape it", "Pick the output and adjust only the settings that matter.", "Route set"],
            ["Take it", "Download a clean result and continue with your work.", "Output done"],
          ].map(([title, copy, state], index) => (
            <article
              key={title}
              className="group/step relative overflow-hidden rounded-tile border border-white/10 bg-white/[0.045] p-5 backdrop-blur-sm transition duration-280 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.075] sm:p-6"
            >
              <span className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-accent/0 transition duration-500 group-hover/step:bg-accent/10" aria-hidden />
              <div className="relative flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-[#211c19] text-accent-light shadow-[0_10px_25px_rgba(0,0,0,0.18)] transition duration-280 group-hover/step:-rotate-3 group-hover/step:scale-105">
                  <WorkflowIcon index={index} />
                </span>
                <span className="font-mono text-micro text-white/40">0{index + 1}</span>
              </div>
              <h3 className="relative mt-8 text-xl font-semibold tracking-[-0.025em]">{title}</h3>
              <p className="relative mt-2 max-w-sm text-sm leading-6 text-white/45">{copy}</p>
              <p className="relative mt-6 flex items-center gap-2 border-t border-white/10 pt-4 font-mono text-micro uppercase text-white/50">
                <span className={`h-1.5 w-1.5 rounded-full ${index === 2 ? "bg-[#55d69a]" : "bg-accent-light"}`} />
                {state}
              </p>
            </article>
          ))}
        </div>
      </section>

      <AdSlot />

      <section className="group/privacy relative isolate overflow-hidden rounded-panel border border-[#ded7d3] bg-white shadow-panel">
        <div
          className="pointer-events-none absolute inset-0 -z-10 opacity-60 [background-image:linear-gradient(rgba(24,20,18,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(24,20,18,0.035)_1px,transparent_1px)] [background-size:40px_40px]"
          aria-hidden
        />
        <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
          <div className="relative flex flex-col justify-between overflow-hidden bg-[#181412] p-6 text-white sm:p-8 lg:min-h-[470px] lg:p-10">
            <div
              className="pointer-events-none absolute inset-0 opacity-30 [background-image:radial-gradient(circle,rgba(255,255,255,0.14)_1px,transparent_1px)] [background-size:10px_10px] [mask-image:linear-gradient(to_bottom_right,transparent,black)]"
              aria-hidden
            />
            <div className="relative">
              <div className="flex items-center justify-between gap-4">
                <p className="text-eyebrow font-bold uppercase text-accent">Private by design</p>
                <p className="flex items-center gap-2 font-mono text-micro uppercase text-white/60">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-[#55d69a]/60 motion-safe:animate-ping" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#55d69a]" />
                  </span>
                  Local mode
                </p>
              </div>
              <h2 className="mt-5 max-w-md text-4xl font-semibold leading-[0.98] tracking-[-0.055em] sm:text-5xl">
                Your file takes the short route.
              </h2>
              <p className="mt-5 max-w-md text-sm leading-6 text-white/55">
                Common conversions happen inside your browser. No account detour, no mystery queue, and no unnecessary trip to a third-party API.
              </p>
            </div>

            <div className="relative mt-10 rounded-tile border border-white/10 bg-black/20 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:mt-12">
              <div className="flex items-center justify-between gap-3">
                <div className="group/file relative flex h-20 w-20 shrink-0 items-end overflow-hidden rounded-2xl border border-white/15 bg-white/[0.07] p-3 transition duration-280 group-hover/privacy:-translate-y-1 group-hover/privacy:-rotate-3">
                  <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-accent" />
                  <svg viewBox="0 0 24 24" className="absolute left-3 top-3 h-6 w-6 text-white/65 transition duration-280 group-hover/privacy:text-white" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                    <path d="M6.5 3.5h7l4 4v13h-11z" strokeLinejoin="round" />
                    <path d="M13.5 3.5v4.5H18M9 12h6M9 15.5h4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="font-mono text-micro font-bold text-white/75">FILE</span>
                </div>

                <div className="relative h-px min-w-14 flex-1 overflow-visible bg-[linear-gradient(to_right,rgba(255,255,255,0.15)_50%,transparent_50%)] bg-[length:8px_1px]" aria-hidden>
                  <span className="absolute left-0 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-accent-light shadow-[0_0_0_4px_rgba(255,106,100,0.12)] motion-safe:animate-[privacy-route_2.8s_ease-in-out_infinite]" />
                </div>

                <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-[#55d69a]/25 bg-[#55d69a]/10 transition duration-280 group-hover/privacy:-translate-y-1 group-hover/privacy:rotate-3">
                  <svg viewBox="0 0 24 24" className="h-7 w-7 text-[#75e0b1]" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                    <path d="M12 3.5 19 6v5.4c0 4.2-2.8 7.4-7 9.1-4.2-1.7-7-4.9-7-9.1V6z" strokeLinejoin="round" />
                    <path d="m8.8 12 2.1 2.1 4.5-4.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between font-mono text-micro uppercase text-white/55">
                <span>Choose locally</span>
                <span className="text-[#75e0b1]">Finish locally</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between p-6 sm:p-8 lg:p-10">
            <div>
              <p className="font-mono text-micro font-semibold uppercase text-faint">What stays simple</p>
              <h3 className="mt-4 max-w-md text-3xl font-semibold leading-[1.05] tracking-[-0.045em] text-ink">
                Fewer hand-offs.<br />More control.
              </h3>
              <p className="mt-5 max-w-lg text-sm leading-7 text-mute">
                Browser-based tools keep supported jobs on this device. That means less waiting, fewer transfers, and a workflow that feels immediate.
              </p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {PRIVACY_POINTS.map((item, index) => (
                <div
                  key={item.number}
                  className="group/benefit relative overflow-hidden rounded-card border border-[#e8e2df] bg-white p-4 shadow-drop transition duration-280 hover:-translate-y-1 hover:border-[#d8cfca] hover:shadow-tile"
                >
                  <span className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-accent-soft transition duration-500 group-hover/benefit:scale-[1.8]" aria-hidden />
                  <span className="absolute right-3 top-3 font-mono text-micro text-accent/60 transition group-hover/benefit:text-accent">{item.number}</span>
                  <span className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-[#e7f8ef] text-[#16885c] transition duration-280 group-hover/benefit:scale-110 group-hover/benefit:rotate-6 group-hover/benefit:bg-accent group-hover/benefit:text-white">
                    <PrivacyIcon index={index} />
                  </span>
                  <h4 className="relative mt-5 text-xs font-semibold text-ink">{item.title}</h4>
                  <p className="relative mt-1 text-[10px] leading-4 text-faint">{item.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative isolate overflow-hidden rounded-panel border border-[#ded7d3] bg-[#f6f3f1] p-6 shadow-panel sm:p-8 lg:p-10">
        <div
          className="pointer-events-none absolute -right-16 -top-20 -z-10 h-72 w-72 rounded-full border-[46px] border-white/70"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 -z-10 opacity-50 [background-image:radial-gradient(circle,rgba(24,20,18,0.1)_1px,transparent_1px)] [background-size:12px_12px] [mask-image:linear-gradient(to_right,black,transparent_48%)]"
          aria-hidden
        />

        <div className="grid gap-8 lg:grid-cols-[0.62fr_1.38fr] lg:gap-12">
          <div className="flex flex-col justify-between">
            <div>
              <p className="text-eyebrow font-bold uppercase text-accent">Good to know</p>
              <h2 className="mt-4 max-w-sm text-4xl font-semibold leading-[1.02] tracking-[-0.05em] text-ink sm:text-5xl">
                The small print, made useful.
              </h2>
              <p className="mt-5 max-w-sm text-sm leading-6 text-mute">
                Clear answers about your files, supported formats, and how the workbench behaves.
              </p>
            </div>
            <div className="mt-10 hidden items-center gap-3 lg:flex">
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d8d0cc] bg-white font-mono text-xs text-accent">?</span>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
                Tap a question<br />to reveal the answer
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {FAQS.map((item, index) => (
              <details
                key={item.question}
                className="group overflow-hidden rounded-card border border-[#e1dad6] bg-white transition duration-280 open:border-[#cfc5c0] open:shadow-tile hover:-translate-y-0.5 hover:border-[#cfc5c0]"
              >
                <summary className="flex cursor-pointer list-none items-center gap-4 p-4 text-sm font-semibold text-ink sm:p-5 [&::-webkit-details-marker]:hidden">
                  <span className="font-mono text-micro font-semibold text-accent/80">0{index + 1}</span>
                  <span className="hidden w-14 text-micro font-bold uppercase text-faint sm:block">{item.label}</span>
                  <span className="flex-1 transition duration-180 group-hover:translate-x-0.5">{item.question}</span>
                  <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#e3ddda] bg-[#faf8f7] transition duration-280 group-hover:border-[#d3cac6] group-open:rotate-45 group-open:border-accent group-open:bg-accent group-open:text-white">
                    <span className="absolute h-px w-3 bg-current" />
                    <span className="absolute h-3 w-px bg-current" />
                  </span>
                </summary>
                <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-300 ease-out group-open:grid-rows-[1fr]">
                  <div className="overflow-hidden">
                    <p className="border-t border-[#eee9e6] px-4 pb-5 pt-4 text-sm leading-6 text-mute sm:ml-[100px] sm:px-5">
                      {item.answer}
                    </p>
                  </div>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
