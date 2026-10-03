import type { Metadata } from "next";
import { ToolGroups } from "@/components/tools/ToolGroups";
import { formatCatalogCount } from "@/data/format-catalog";
import { SITE_NAME } from "@/lib/site";
import { tools } from "@/lib/tools";

function DirectoryStatIcon({ index }: { index: number }) {
  const paths = [
    <><rect key="a" x="3" y="3" width="6" height="6" rx="1.2" /><rect key="b" x="11" y="3" width="6" height="6" rx="1.2" /><rect key="c" x="3" y="11" width="6" height="6" rx="1.2" /><path key="d" d="M12 13.5h5M14.5 11v5" /></>,
    <><path key="a" d="M3.5 6.5h13v10h-13z" /><path key="b" d="M3.5 6.5 7 3.5h6l3.5 3" /><path key="c" d="M7 10.5h6" /></>,
    <><path key="a" d="M6 3.5h6l4 4V17H6z" /><path key="b" d="M12 3.5V8h4M8.5 12h5M8.5 14.5h3.5" /></>,
  ];

  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {paths[index]}
    </svg>
  );
}

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
            <p className="flex items-center gap-3 text-eyebrow font-bold uppercase text-accent-ink">
              <span className="h-px w-7 bg-accent-ink" />
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
            <p className="relative font-mono text-micro uppercase text-white/55">Directory overview</p>
            <p className="relative mt-4 max-w-md text-sm leading-6 text-white/55">
              Search once, narrow the category, then open a workspace built specifically for that result.
            </p>
            <div className="relative mt-5 grid grid-cols-3 gap-px overflow-hidden rounded-card border border-white/10 bg-white/10">
              {[
                [String(tools.length), "Conversion tools"],
                [String(categoryCount), "File categories"],
                [String(formatCatalogCount), "Supported formats"],
              ].map(([value, label], index) => (
                <div key={label} className="flex flex-col gap-3 bg-[#1e1917] p-3 sm:p-3.5">
                  <span className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/[0.05] text-accent-light">
                    <DirectoryStatIcon index={index} />
                  </span>
                  <div>
                    <p className="text-lg font-semibold tracking-tight text-white">{value}</p>
                    <p className="mt-1 text-micro font-semibold uppercase leading-4 text-white/70">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      <ToolGroups showIntro={false} />
    </div>
  );
}
