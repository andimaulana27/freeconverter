import type { Metadata } from "next";
import { ToolGroups } from "@/components/tools/ToolGroups";
import { SITE_NAME } from "@/lib/site";

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
  return (
    <div className="flex flex-col gap-12 pb-8">
      <header className="grid gap-6 border-b border-[#e5dfdc] pb-10 lg:grid-cols-[1fr_0.7fr] lg:items-end">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">Format directory</p>
          <h1 className="mt-4 text-5xl font-semibold leading-[0.98] tracking-[-0.055em] text-ink sm:text-6xl">
            Every tool.<br />One clear library.
          </h1>
        </div>
        <p className="max-w-md text-sm leading-6 text-mute lg:justify-self-end">
          Browse conversion, compression, PDF, office, ebook, archive, font, video, and utility workflows. Pick a tool to open its focused workspace.
        </p>
      </header>
      <ToolGroups showIntro={false} />
    </div>
  );
}
