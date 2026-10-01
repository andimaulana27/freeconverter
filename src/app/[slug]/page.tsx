import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DropEngine } from "@/components/convert/DropEngine";
import { FormatGlyph } from "@/components/convert/FormatArtwork";
import { FormatPair } from "@/components/convert/FormatPair";
import { ToolSignals } from "@/components/convert/ToolSignals";
import { AdSlot } from "@/components/layout/AdSlot";
import { JsonLd } from "@/components/seo/JsonLd";
import { ToolIcon } from "@/components/tools/ToolIcon";
import { breadcrumbJsonLd, toolHeadline, toolJsonLd, toolMetadata } from "@/lib/seo";
import { SITE_NAME } from "@/lib/site";
import { conversionSource, getTool, relatedTools, siblingConversions, toolBlurb, tools } from "@/lib/tools";

type Props = { params: Promise<{ slug: string }> };

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
  const alternatives = siblingConversions(tool);
  const hasAlternatives = alternatives.length > 1;
  const from = conversionSource(tool);
  const formats = (tool.inputs ?? []).map((item) => item.toUpperCase()).join(", ");
  return (
    <div className="flex flex-col gap-14 pb-8 sm:gap-20">
      <JsonLd
        data={tool.need === "browser" ? [toolJsonLd(tool), breadcrumbJsonLd(tool)] : breadcrumbJsonLd(tool)}
      />

      <header>
        <nav className="flex items-center gap-2 text-[11px] text-faint" aria-label="Breadcrumb">
          <Link href="/" className="transition hover:text-ink">Home</Link>
          <span>/</span>
          <Link href="/tools" className="transition hover:text-ink">Tools</Link>
          <span>/</span>
          <span className="text-mute">{tool.title}</span>
        </nav>
        <div className="mt-8 grid items-end gap-8 lg:grid-cols-[1fr_auto]">
          <div>
            <div className="flex items-center gap-4">
              <ToolIcon tool={tool} index={tools.findIndex((item) => item.slug === tool.slug)} className="h-12 w-12 rounded-2xl" />
              {from ? <FormatPair from={from} to={tool.output} /> : (
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">{tool.category} tool</p>
              )}
            </div>
            <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-[1.02] tracking-[-0.05em] text-ink sm:text-5xl">
              {headline}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-mute">{toolBlurb(tool)}</p>
          </div>
          <p className="hidden items-center gap-2 text-[11px] text-faint lg:flex">
            <span className={`h-2 w-2 rounded-full ${tool.need === "browser" ? "bg-[#21a36e]" : "bg-[#d87512]"}`} />
            {tool.need === "browser" ? "Ready in your browser" : "Worker coming soon"}
          </p>
        </div>
      </header>

      <section className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="overflow-hidden rounded-[24px] border border-[#dfd8d4] bg-white shadow-[0_24px_70px_rgba(44,30,24,0.11)]">
          <div className="flex items-center justify-between bg-[#181412] px-5 py-3.5 text-white">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em]">Conversion workspace</p>
            <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-white/45">
              {tool.need === "browser" ? "Local mode" : "Worker mode"}
            </p>
          </div>
          <DropEngine tool={tool} />
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20">
          <div className="rounded-2xl border border-[#e5dfdc] bg-white p-5">
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-faint">This job</p>
            <dl className="mt-4 space-y-4 text-sm">
              <div className="flex items-start justify-between gap-4 border-b border-[#eee9e6] pb-3">
                <dt className="text-mute">Accepts</dt>
                <dd className="text-right font-mono text-xs font-semibold text-ink">{formats || "No file"}</dd>
              </div>
              <div className="flex items-start justify-between gap-4 border-b border-[#eee9e6] pb-3">
                <dt className="text-mute">Output</dt>
                <dd className="font-mono text-xs font-semibold text-accent">{tool.output.toUpperCase()}</dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-mute">Privacy</dt>
                <dd className="text-right text-xs font-semibold text-ink">
                  {tool.need === "browser" ? "On-device" : "Private worker"}
                </dd>
              </div>
            </dl>
          </div>

          {alternatives.length > 1 ? (
            <div className="rounded-2xl border border-[#e5dfdc] bg-white p-5">
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-faint">Choose output</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {alternatives.map((item) => {
                  const active = item.slug === tool.slug;
                  return (
                    <Link
                      key={item.slug}
                      href={`/${item.slug}`}
                      aria-current={active ? "page" : undefined}
                      className={`rounded-lg px-3 py-2 font-mono text-[11px] font-semibold transition ${
                        active ? "bg-accent text-white" : "bg-[#f5f2f0] text-mute hover:bg-[#ebe5e2] hover:text-ink"
                      }`}
                    >
                      {item.output.toUpperCase()}
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : null}

          <ToolSignals need={tool.need} hasAlternatives={hasAlternatives} compact />
        </aside>
      </section>

      <AdSlot />

      <section className="grid gap-8 lg:grid-cols-[0.65fr_1.35fr]">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">How it works</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-ink">
            One focused job.<br />Three clear steps.
          </h2>
        </div>
        <div className="grid gap-px overflow-hidden rounded-2xl border border-[#e5dfdc] bg-[#e5dfdc] sm:grid-cols-3">
          {[
            ["01", "Select", `Add your ${formats || "input"} file.`],
            ["02", "Convert", `Process it as ${tool.output.toUpperCase()}.`],
            ["03", "Download", "Save the finished file."],
          ].map(([number, title, copy]) => (
            <div key={number} className="bg-white p-5">
              <span className="font-mono text-[10px] text-accent">{number}</span>
              <h3 className="mt-8 text-base font-semibold text-ink">{title}</h3>
              <p className="mt-1 text-xs leading-5 text-mute">{copy}</p>
            </div>
          ))}
        </div>
      </section>

      {related.length ? (
        <section>
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">Keep working</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">Related tools</h2>
            </div>
            <Link href="/tools" className="text-xs font-semibold text-mute transition hover:text-accent">View all tools →</Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((item, index) => (
              <Link
                key={item.slug}
                href={`/${item.slug}`}
                className="group rounded-2xl border border-[#e5dfdc] bg-white p-4 transition duration-280 hover:-translate-y-1 hover:shadow-[0_14px_32px_rgba(40,27,22,0.08)]"
              >
                <div className="flex items-center justify-between">
                  <ToolIcon tool={item} index={index + 2} />
                  <FormatGlyph format={item.output} category={item.category} />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-ink">{toolHeadline(item)}</h3>
                <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-mute">{toolBlurb(item)}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="grid gap-8 border-t border-[#e5dfdc] pt-12 lg:grid-cols-[1fr_320px] lg:gap-14">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">About this converter</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-ink">{headline}, without the detour.</h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-mute">
            This {SITE_NAME} workspace is built specifically for {headline.toLowerCase()}. It accepts {formats || "no file input"} and produces {tool.output.toUpperCase()}.
            {tool.need === "browser" ? " Processing happens on this device whenever the browser supports it." : " Processing starts when the dedicated worker is available."}
          </p>
        </div>
        <AdSlot format="rectangle" />
      </section>
    </div>
  );
}
