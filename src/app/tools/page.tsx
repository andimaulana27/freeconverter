import type { Metadata } from "next";
import { ToolGroups } from "@/components/tools/ToolGroups";
import { SITE_NAME } from "@/lib/site";
import { tools } from "@/lib/tools";

export const metadata: Metadata = {
  title: "All tools",
    description: `Browse every ${SITE_NAME} converter across images, PDF, documents, sheets, slides, ebooks, archives, vector, CAD, fonts, video, and audio.`,
  alternates: { canonical: "/tools" },
  openGraph: {
    title: `All conversion tools · ${SITE_NAME}`,
    description: `Browse every ${SITE_NAME} image, PDF, document, ebook, archive, font, video, and audio tool.`,
    url: "/tools",
  },
};

export default function ToolsIndex() {
  const categoryCount = new Set(tools.map((tool) => tool.category)).size;

  return (
    <div className="flex flex-col gap-10 sm:gap-12">
      <header className="group/directory relative isolate overflow-hidden rounded-panel border border-[#ded7d3] bg-white p-6 shadow-panel sm:p-8 lg:p-10">
        <div
          className="pointer-events-none absolute inset-0 -z-10 opacity-55 [background-image:linear-gradient(rgba(24,20,18,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(24,20,18,0.035)_1px,transparent_1px)] [background-size:40px_40px]"
          aria-hidden
        />
        <div className="pointer-events-none absolute -right-28 -top-28 -z-10 h-80 w-80 rounded-full border-[52px] border-[#f2eeec] transition duration-700 group-hover/directory:scale-110" aria-hidden />

        <div className="relative grid items-end gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10">
          <div>
            <p className="flex items-center gap-3 text-eyebrow font-bold uppercase text-accent">
              <span className="h-px w-7 bg-accent" />
              Format directory
            </p>
            <h1 className="mt-4 text-5xl font-semibold leading-[0.98] tracking-[-0.055em] text-ink sm:text-6xl">
              Every tool.<br />One clear library.
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-6 text-mute sm:text-base">
              Browse conversion, compression, PDF, office, ebook, archive, font, video, audio, and utility workflows.
            </p>
          </div>

          <div className="relative overflow-hidden rounded-tile border border-[#2e2926] bg-[#181412] p-5 text-white shadow-panel-dark">
            <div
              className="pointer-events-none absolute inset-0 opacity-25 [background-image:radial-gradient(circle,rgba(255,255,255,0.18)_1px,transparent_1.2px)] [background-size:10px_10px]"
              aria-hidden
            />
            <div className="relative flex items-center justify-between border-b border-white/10 pb-4">
              <p className="font-mono text-micro uppercase text-white/55">Directory overview</p>
              <span className="flex items-center gap-2 font-mono text-micro uppercase text-[#75e0b1]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#55d69a]" />
                Ready
              </span>
            </div>
            <p className="relative mt-4 max-w-md text-sm leading-6 text-white/55">
              Search once, narrow the category, then open a workspace built specifically for that result.
            </p>
            <dl className="relative mt-5 grid grid-cols-3 gap-px overflow-hidden rounded-card border border-white/10 bg-white/10">
              {[
                [String(tools.length), "Tools"],
                [String(categoryCount), "Categories"],
                ["One", "Focused route"],
              ].map(([value, label]) => (
                <div key={label} className="bg-[#1e1917] p-3">
                  <dt className="text-lg font-semibold text-white">{value}</dt>
                  <dd className="mt-1 text-micro font-semibold uppercase text-white/40">{label}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </header>

      <ToolGroups showIntro={false} />
    </div>
  );
}
