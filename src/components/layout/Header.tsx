"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { SITE_NAME } from "@/lib/site";
import { Container } from "@/components/ui/Container";

const NAV = [
  { href: "/#tools", label: "All tools", index: "01" },
  { href: "/#gambar", label: "Images", index: "02" },
  { href: "/#pdf", label: "PDF", index: "03" },
  { href: "/#dokumen", label: "Documents", index: "04" },
  { href: "/#utilitas", label: "Utilities", index: "05" },
];

export function Header() {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-50 isolate overflow-hidden border-b border-[#ded8d4] bg-white/90 shadow-[0_1px_0_rgba(17,17,17,0.02),0_10px_35px_rgba(42,28,22,0.035)] backdrop-blur-xl">
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-70 [background-image:linear-gradient(rgba(24,20,18,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(24,20,18,0.035)_1px,transparent_1px)] [background-size:32px_32px] [mask-image:linear-gradient(to_right,black,transparent_72%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 -z-10 w-[34rem] opacity-55 [background-image:radial-gradient(circle,rgba(217,45,40,0.24)_1px,transparent_1.2px)] [background-size:9px_9px] [mask-image:linear-gradient(to_left,black,transparent)]"
        aria-hidden
      />
      <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/70 to-transparent" aria-hidden />

      <Container className="flex h-[68px] w-[calc(100%_-_2rem)] max-w-[1440px] items-stretch gap-5 px-0 sm:w-[calc(100%_-_3rem)] sm:gap-8 sm:px-0">
        <Link href="/" className="group flex shrink-0 items-center gap-3 text-ink" aria-label={`${SITE_NAME} home`}>
          <span className="relative flex h-10 w-10 items-center justify-center">
            <span className="absolute inset-[3px] translate-x-1.5 -rotate-6 rounded-[11px] border border-[#d7cfcb] bg-[#f3efed] transition duration-280 group-hover:translate-x-2 group-hover:-rotate-12" aria-hidden />
            <span className="relative flex h-9 w-9 items-center justify-center rounded-[11px] bg-[#181412] text-white shadow-[0_7px_18px_rgba(42,28,22,0.2)] transition duration-280 group-hover:-translate-y-0.5 group-hover:rotate-3">
              <svg viewBox="0 0 24 24" className="h-[19px] w-[19px]" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                <path d="M6.5 4.5h7l4 4v11h-11z" strokeLinejoin="round" />
                <path d="M13.5 4.5v4h4" strokeLinejoin="round" />
                <path d="M9 14h6m-2.3-2.3L15 14l-2.3 2.3" className="text-[#ff6a64]" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-accent" aria-hidden />
            </span>
          </span>
          <span>
            <span className="block text-[15px] font-bold leading-none tracking-[-0.03em]">
              {SITE_NAME.slice(0, 6)}<span className="text-accent">{SITE_NAME.slice(6)}</span>
            </span>
            <span className="mt-1.5 hidden font-mono text-[8px] font-semibold uppercase leading-none tracking-[0.18em] text-[#8c827d] sm:block">
              File workbench
            </span>
          </span>
        </Link>

        <span className="my-4 hidden w-px bg-[#ddd6d2] sm:block" aria-hidden />

        <nav className="hidden flex-1 items-stretch gap-1 text-[12px] lg:flex" aria-label="Primary navigation">
          {NAV.map((item) => {
            const active = item.href === "/#tools" ? path === "/tools" : false;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex items-center gap-1.5 px-2 font-semibold text-mute transition duration-180 hover:text-ink xl:px-3",
                  "after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:origin-left after:scale-x-0 after:bg-accent after:transition-transform after:duration-280 hover:after:scale-x-100",
                  active && "text-ink after:scale-x-100",
                )}
              >
                <span className="font-mono text-[8px] font-medium text-[#aaa19c] transition group-hover:text-accent">{item.index}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto hidden items-center gap-2.5 2xl:flex">
          <span>
            <span className="block text-[9px] font-bold uppercase leading-none tracking-[0.14em] text-ink">Private by design</span>
            <span className="mt-1 block text-[9px] leading-none text-faint">On-device when supported</span>
          </span>
        </div>

        <Link
          href={path === "/" ? "/#converter" : "/#tools"}
          className="group my-auto ml-auto inline-flex shrink-0 items-center gap-2 rounded-xl bg-accent px-3.5 py-2.5 text-[11px] font-bold text-white shadow-[0_8px_20px_rgba(217,45,40,0.24)] transition duration-180 hover:-translate-y-0.5 hover:bg-accent-ink active:scale-[0.98] lg:ml-0 sm:px-4"
        >
          <span className="sm:hidden">{path === "/" ? "Convert" : "Tools"}</span>
          <span className="hidden sm:inline">{path === "/" ? "Start converting" : "Browse tools"}</span>
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 transition duration-180 group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <path d="M2.5 8h10m-4-4 4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </Container>
    </header>
  );
}
