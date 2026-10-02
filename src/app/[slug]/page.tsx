import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DropEngine } from "@/components/convert/DropEngine";
import { FormatGlyph } from "@/components/convert/FormatArtwork";
import { ToolSignals } from "@/components/convert/ToolSignals";
import { AdSlot } from "@/components/layout/AdSlot";
import { JsonLd } from "@/components/seo/JsonLd";
import { ToolIcon } from "@/components/tools/ToolIcon";
import { breadcrumbJsonLd, toolHeadline, toolJsonLd, toolMetadata } from "@/lib/seo";
import { SITE_NAME } from "@/lib/site";
import { conversionSource, getTool, relatedTools, siblingConversions, toolBlurb, tools } from "@/lib/tools";

type Props = { params: Promise<{ slug: string }> };

function ArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M3 10h13m-5-5 5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StepIcon({ index }: { index: number }) {
  const paths = [
    <><path key="a" d="M5 3h7l4 4v10H5z" /><path key="b" d="M12 3v4h4M8 12h5M10.5 9.5v5" /></>,
    <><path key="a" d="M4 6h9l-2.5-2.5M16 14H7l2.5 2.5M13 6l-2.5 2.5M7 14l2.5-2.5" /><circle key="b" cx="15.5" cy="6" r="1.5" /></>,
    <><path key="a" d="M10 3v10m0 0 4-4m-4 4L6 9M4 17h12" /></>,
  ];

  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {paths[index]}
    </svg>
  );
}

function SpecIcon({ type }: { type: "input" | "output" | "privacy" }) {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {type === "input" ? <><path d="M4 3h8l4 4v10H4z" /><path d="M12 3v4h4M7 11h6M7 14h4" /></> : null}
      {type === "output" ? <><path d="M4 10h11m-4-4 4 4-4 4" /><path d="M4 4v12" /></> : null}
      {type === "privacy" ? <><path d="M10 2.5 16.5 5v5c0 4-2.6 6.3-6.5 7.7C6.1 16.3 3.5 14 3.5 10V5z" /><path d="m7 10 2 2 4-4" /></> : null}
    </svg>
  );
}

export const dynamicParams = false;

export function generateStaticParams() {
  return tools.map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) return { robots: { index: false, follow: true } };
  return toolMetadata(tool);
}

export default async function ToolPage({ params }: Props) {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) notFound();
  const headline = toolHeadline(tool);
  const related = relatedTools(tool);
  const hasAlternatives = siblingConversions(tool).length > 1;
  const from = conversionSource(tool);
  const formats = (tool.inputs ?? []).map((item) => item.toUpperCase()).join(", ");
  const primaryInput = (from ?? tool.inputs?.[0] ?? "file").toUpperCase();

  return (
    <div className="flex flex-col gap-10 sm:gap-12">
      <JsonLd
        data={tool.need === "browser" ? [toolJsonLd(tool), breadcrumbJsonLd(tool)] : breadcrumbJsonLd(tool)}
      />

      <section>
        <h1 className="sr-only">{headline}</h1>
        <div className="overflow-hidden rounded-panel border border-[#dcd4d0] bg-white shadow-panel">
          <div className="flex items-center justify-between gap-4 bg-[#181412] px-5 py-4 text-white sm:px-7">
            <div className="flex items-center gap-3">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-accent text-white shadow-action">
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                  <path d="M10 3v10m0 0 4-4m-4 4L6 9M4 16h12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span>
                <p className="text-micro font-bold uppercase sm:text-eyebrow">Conversion workspace</p>
                <p className="mt-0.5 hidden text-micro text-white/40 sm:block">Drop or upload a file, then convert in this card.</p>
              </span>
            </div>
            <p className="flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 font-mono text-micro uppercase text-white/60">
              <span className={`h-1.5 w-1.5 rounded-full ${tool.need === "browser" ? "bg-[#55d69a]" : "bg-[#d9923b]"}`} />
              {tool.need === "browser" ? "Local mode" : "Worker mode"}
            </p>
          </div>
          <DropEngine tool={tool} />
        </div>

        <div className="mt-5 grid items-stretch gap-4 lg:grid-cols-2">
          <div className="h-full overflow-hidden rounded-tile border border-[#dfd8d4] bg-white shadow-tile">
            <div className="flex items-center justify-between border-b border-[#eee9e6] px-5 py-4">
              <p className="text-eyebrow font-bold uppercase text-ink">Job details</p>
              <span className="font-mono text-micro uppercase text-faint">Focused route</span>
            </div>
            <dl className="divide-y divide-[#eee9e6] px-5">
              {([
                ["input" as const, "Accepts", formats || "No file"],
                ["output" as const, "Output", tool.output.toUpperCase()],
                ["privacy" as const, "Privacy", tool.need === "browser" ? "On-device" : "Private worker"],
              ] as const).map(([type, label, value]) => (
                <div key={label} className="flex items-center gap-3 py-4">
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${type === "output" ? "bg-accent-soft text-accent" : type === "privacy" ? "bg-[#e7f8ef] text-[#16885c]" : "bg-[#f3f0ee] text-mute"}`}>
                    <SpecIcon type={type} />
                  </span>
                  <dt className="text-xs text-mute">{label}</dt>
                  <dd className={`ml-auto max-w-[45%] text-right font-mono text-[11px] font-semibold ${type === "output" ? "text-accent" : "text-ink"}`}>{value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <ToolSignals need={tool.need} hasAlternatives={hasAlternatives} />
        </div>
      </section>

      <AdSlot />

      <section className="relative isolate overflow-hidden rounded-panel border border-white/10 bg-[#181412] p-6 text-white shadow-panel-dark sm:p-8 lg:p-10">
        <div
          className="pointer-events-none absolute inset-0 -z-10 opacity-35 [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:44px_44px]"
          aria-hidden
        />
        <div className="pointer-events-none absolute -right-24 -top-28 -z-10 h-72 w-72 rounded-full border-[42px] border-white/[0.035]" aria-hidden />

        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="flex items-center gap-3 text-eyebrow font-bold uppercase text-accent">
              <span className="h-px w-7 bg-accent" />
              How it works
            </p>
            <h2 className="mt-4 max-w-2xl text-4xl font-semibold leading-[1.02] tracking-[-0.05em] sm:text-5xl">
              One focused job.<br />Three clear steps.
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-6 text-white/45">A direct route from {primaryInput} to {tool.output.toUpperCase()}, with only the controls this job needs.</p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            ["01", "Select", `Add your ${formats || "input"} file.`],
            ["02", "Convert", `Process it as ${tool.output.toUpperCase()}.`],
            ["03", "Download", "Save the finished file."],
          ].map(([number, title, copy], index) => (
            <div key={number} className="group/step relative overflow-hidden rounded-tile border border-white/10 bg-white/[0.045] p-5 transition duration-280 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.075] sm:p-6">
              <div className="flex items-center justify-between">
                <span className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-[#211c19] text-accent-light transition duration-280 group-hover/step:-rotate-3 group-hover/step:scale-105">
                  <StepIcon index={index} />
                </span>
                <span className="font-mono text-micro text-white/35">{number}</span>
              </div>
              <h3 className="mt-7 text-lg font-semibold text-white">{title}</h3>
              <p className="mt-2 text-xs leading-5 text-white/45">{copy}</p>
              <p className="mt-6 flex items-center gap-2 border-t border-white/10 pt-4 font-mono text-micro uppercase text-white/45">
                <span className={`h-1.5 w-1.5 rounded-full ${index === 2 ? "bg-[#55d69a]" : "bg-accent-light"}`} />
                Step {number}
              </p>
            </div>
          ))}
        </div>
      </section>

      {related.length ? (
        <section className="relative isolate overflow-hidden rounded-panel border border-[#ded7d3] bg-white p-6 shadow-panel sm:p-8 lg:p-10">
          <div
            className="pointer-events-none absolute inset-0 -z-10 opacity-45 [background-image:linear-gradient(rgba(24,20,18,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(24,20,18,0.03)_1px,transparent_1px)] [background-size:40px_40px]"
            aria-hidden
          />
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-eyebrow font-bold uppercase text-accent">Keep working</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-ink">Related tools</h2>
            </div>
            <Link href="/tools" className="group flex items-center gap-2 text-xs font-semibold text-mute transition hover:text-accent">
              View all tools <span className="transition group-hover:translate-x-1"><ArrowIcon /></span>
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((item, index) => (
              <Link
                key={item.slug}
                href={`/${item.slug}`}
                className="group rounded-card border border-[#e5dfdc] bg-white p-5 shadow-tile transition duration-280 hover:-translate-y-1 hover:border-[#d3cac6] hover:shadow-panel"
              >
                <div className="flex items-center justify-between">
                  <ToolIcon tool={item} index={index + 2} />
                  <FormatGlyph format={item.output} category={item.category} />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-ink">{toolHeadline(item)}</h3>
                <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-mute">{toolBlurb(item)}</p>
                <span className="mt-4 flex items-center gap-2 border-t border-[#eee9e6] pt-3 font-mono text-micro uppercase text-faint transition group-hover:text-accent">
                  Open workspace <span className="transition group-hover:translate-x-1">→</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="group/about relative isolate overflow-hidden rounded-panel border border-[#ded7d3] bg-[#f6f3f1] p-6 shadow-panel sm:p-8 lg:p-10">
        <div
          className="pointer-events-none absolute inset-0 -z-10 opacity-50 [background-image:radial-gradient(circle,rgba(24,20,18,0.1)_1px,transparent_1px)] [background-size:12px_12px] [mask-image:linear-gradient(to_right,black,transparent_55%)]"
          aria-hidden
        />
        <div className="pointer-events-none absolute -left-20 -bottom-24 -z-10 h-64 w-64 rounded-full border-[42px] border-white/70 transition duration-700 group-hover/about:scale-110" aria-hidden />

        <div className="grid items-stretch gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-10">
          <div className="flex flex-col justify-center">
            <p className="flex items-center gap-3 text-eyebrow font-bold uppercase text-accent">
              <span className="h-px w-7 bg-accent" />
              About this converter
            </p>
            <h2 className="mt-4 max-w-2xl text-3xl font-semibold leading-[1.04] tracking-[-0.045em] text-ink sm:text-4xl">{headline}, without the detour.</h2>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-mute">
              This {SITE_NAME} workspace is built specifically for {headline.toLowerCase()}. It accepts {formats || "no file input"} and produces {tool.output.toUpperCase()}.
              {tool.need === "browser" ? " Processing happens on this device whenever the browser supports it." : " Processing starts when the dedicated worker is available."}
            </p>
            <div className="mt-7 flex flex-wrap gap-2">
              {["Focused controls", tool.need === "browser" ? "On-device" : "Private worker", "No sign-up"].map((label) => (
                <span key={label} className="rounded-full border border-[#ded7d3] bg-white px-3 py-2 font-mono text-micro font-semibold uppercase text-faint shadow-drop">{label}</span>
              ))}
            </div>
          </div>
          <AdSlot format="rectangle" className="min-h-56 bg-white/70" />
        </div>
      </section>
    </div>
  );
}
