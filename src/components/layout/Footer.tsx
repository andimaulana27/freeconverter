import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Logo } from "@/components/layout/Logo";
import { SITE_NAME } from "@/lib/site";

const FOOTER_GROUPS = [
  {
    title: "Popular conversions",
    links: [
      { href: "/png-to-jpg", label: "PNG to JPG" },
      { href: "/pdf-to-docx", label: "PDF to Word" },
      { href: "/heic-to-jpg", label: "HEIC to JPG" },
      { href: "/xlsx-to-pdf", label: "Excel to PDF" },
      { href: "/mp4-to-mp3", label: "MP4 to MP3" },
    ],
  },
  {
    title: "PDF workspace",
    links: [
      { href: "/merge-pdf", label: "Merge PDF" },
      { href: "/split-pdf", label: "Split PDF" },
      { href: "/compress-pdf", label: "Compress PDF" },
      { href: "/pdf-to-jpg", label: "PDF to JPG" },
      { href: "/protect-pdf", label: "Protect PDF" },
    ],
  },
  {
    title: "Browse formats",
    links: [
      { href: "/tools#gambar", label: "Image tools" },
      { href: "/tools#dokumen", label: "Document tools" },
      { href: "/tools#spreadsheet", label: "Spreadsheet tools" },
      { href: "/tools#video", label: "Video tools" },
      { href: "/tools#arsip", label: "Archive tools" },
    ],
  },
  {
    title: "AllYouConvert",
    links: [
      { href: "/tools", label: "All tools" },
      { href: "/#converter", label: "Quick converter" },
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
    ],
  },
] as const;

export function Footer() {
  return (
    <footer className="relative isolate mt-16 overflow-hidden border-t border-white/10 bg-[#171311] text-white">
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-45 [background-image:linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] [background-size:52px_52px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 -z-10 w-[45rem] opacity-35 [background-image:radial-gradient(circle,rgba(255,106,100,0.5)_1px,transparent_1.2px)] [background-size:11px_11px] [mask-image:linear-gradient(to_left,black,transparent)]"
        aria-hidden
      />
      <div className="pointer-events-none absolute -right-32 -top-36 -z-10 h-[28rem] w-[28rem] rounded-full border-[64px] border-white/[0.025]" aria-hidden />

      <Container className="max-w-[1440px] py-7 sm:py-10">
        <div className="group/cta relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.045] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:p-8 lg:p-10">
          <div className="pointer-events-none absolute -bottom-24 right-[22%] h-56 w-56 rounded-full border border-white/[0.07] transition duration-700 group-hover/cta:scale-110" aria-hidden />
          <div className="relative grid items-end gap-8 lg:grid-cols-[1fr_auto]">
            <div>
              <p className="flex items-center gap-3 text-[9px] font-bold uppercase tracking-[0.2em] text-[#ff8c87]">
                <span className="h-px w-7 bg-[#ff6a64]" />
                Your next format is one move away
              </p>
              <h2 className="mt-4 max-w-2xl text-3xl font-semibold leading-[1.02] tracking-[-0.045em] sm:text-4xl lg:text-5xl">
                Bring the file. Leave with exactly what you need.
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-6 text-white/50">
                A focused conversion desk with clear outputs, no account wall, and local processing whenever your browser supports it.
              </p>
            </div>

            <div className="flex flex-col items-start gap-4 lg:items-end">
              <div className="hidden items-center gap-2 lg:flex" aria-hidden>
                {["PDF", "→", "JPG"].map((item, index) => (
                  <span
                    key={item + index}
                    className={
                      item === "→"
                        ? "px-1 font-mono text-sm text-[#ff6a64]"
                        : "flex h-12 w-12 items-end rounded-xl border border-white/10 bg-black/20 p-2 font-mono text-[8px] font-bold tracking-[0.12em] text-white/55 transition duration-280 group-hover/cta:-translate-y-1"
                    }
                  >
                    {item}
                  </span>
                ))}
              </div>
              <Link
                href="/#converter"
                className="group inline-flex items-center gap-3 rounded-xl bg-accent px-5 py-3.5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(217,45,40,0.28)] transition duration-180 hover:-translate-y-0.5 hover:bg-[#ef3b35]"
              >
                Open the workbench
                <svg viewBox="0 0 16 16" className="h-4 w-4 transition group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
                  <path d="M2 8h11m-4-4 4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-12 border-b border-white/10 py-12 lg:grid-cols-[1.05fr_3fr] lg:gap-16 lg:py-14">
          <div>
            <Link href="/" className="group inline-flex items-center text-white" aria-label={`${SITE_NAME} home`}>
              <Logo className="h-14 w-auto text-white transition duration-280 group-hover:-translate-y-0.5 sm:h-16" />
            </Link>
            <p className="mt-5 max-w-xs text-sm leading-6 text-white/50">
              Purpose-built file tools for converting, compressing, and organizing everyday formats—without unnecessary steps.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 font-mono text-[8px] uppercase tracking-[0.15em] text-white/40">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-[#55d69a]/60 motion-safe:animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#55d69a]" />
              </span>
              Browser tools ready
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-4">
            {FOOTER_GROUPS.map((group, index) => (
              <nav key={group.title} className="border-l border-white/10 pl-4 sm:pl-5" aria-label={group.title}>
                <p className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.17em] text-white/35">
                  <span className="font-mono text-[#ff6a64]">0{index + 1}</span>
                  {group.title}
                </p>
                <ul className="mt-5 space-y-3">
                  {group.links.map((link) => (
                    <li key={link.href + link.label}>
                      <Link
                        href={link.href}
                        className="group inline-flex items-center gap-2 text-xs text-white/55 transition duration-180 hover:translate-x-1 hover:text-white"
                      >
                        <span className="h-1 w-1 rounded-full bg-white/20 transition duration-180 group-hover:scale-150 group-hover:bg-[#ff6a64]" aria-hidden />
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4 pt-6 font-mono text-[8px] uppercase tracking-[0.12em] text-white/30 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 {SITE_NAME} / Free file tools, clearly labeled.</p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <p className="flex items-center gap-2"><span className="h-1 w-1 rounded-full bg-[#ff6a64]" />No metered API</p>
            <p className="flex items-center gap-2"><span className="h-1 w-1 rounded-full bg-[#ff6a64]" />No account required</p>
            <Link href="/privacy" className="transition hover:text-white">Privacy by design ↗</Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
