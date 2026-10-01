import Link from "next/link";
import { Container } from "@/components/ui/Container";
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
    <footer className="mt-10 overflow-hidden bg-[#171311] text-white">
      <Container className="py-12 sm:py-16">
        <div className="grid gap-12 border-b border-white/10 pb-12 lg:grid-cols-[1.25fr_3fr] lg:gap-16">
          <div>
            <Link href="/" className="group inline-flex items-center gap-3 text-lg font-bold tracking-[-0.025em] text-white">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-white shadow-[0_8px_22px_rgba(217,45,40,0.3)] transition duration-280 group-hover:-rotate-6 group-hover:scale-105">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M7 4h7l4 4v12H7z" strokeLinejoin="round" />
                  <path d="M14 4v5h5M10 14h5m-2-2 2 2-2 2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span>{SITE_NAME.slice(0, 6)}<span className="text-[#ff6a64]">{SITE_NAME.slice(6)}</span></span>
            </Link>
            <p className="mt-5 max-w-xs text-sm leading-6 text-white/55">
              Focused file tools for converting, compressing, and organizing everyday formats—without accounts or unnecessary steps.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4">
            {FOOTER_GROUPS.map((group) => (
              <nav key={group.title} aria-label={group.title}>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">{group.title}</p>
                <ul className="mt-4 space-y-3">
                  {group.links.map((link) => (
                    <li key={link.href + link.label}>
                      <Link
                        href={link.href}
                        className="group inline-flex items-center gap-2 text-xs text-white/60 transition duration-180 hover:translate-x-0.5 hover:text-white"
                      >
                        <span className="h-px w-0 bg-[#ff6a64] transition-all duration-180 group-hover:w-2" aria-hidden />
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4 pt-6 text-[10px] text-white/35 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 {SITE_NAME}. Free file tools, clearly labeled.</p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <p>No metered conversion API</p>
            <p>No account required</p>
            <Link href="/privacy" className="transition hover:text-white">Privacy by design</Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
