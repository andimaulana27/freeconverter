"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { SITE_NAME } from "@/lib/site";
import { Container } from "@/components/ui/Container";

const NAV = [
  { href: "/#tools", label: "All tools" },
  { href: "/#gambar", label: "Images" },
  { href: "/#pdf", label: "PDF" },
  { href: "/#dokumen", label: "Documents" },
  { href: "/#utilitas", label: "Utilities" },
];

export function Header() {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-20 border-b border-[#ede8e5] bg-white/85 backdrop-blur-xl">
      <Container className="flex h-14 max-w-[1440px] items-center gap-5 sm:gap-8">
        <Link href="/" className="group flex shrink-0 items-center gap-2.5 text-[15px] font-bold tracking-[-0.02em] text-ink">
          <span className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-[10px] bg-accent text-white shadow-[0_5px_14px_rgba(229,50,45,0.25)] transition duration-280 group-hover:rotate-[-6deg] group-hover:scale-105">
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M7 4h7l4 4v12H7z" strokeLinejoin="round" />
              <path d="M14 4v5h5M10 14h5m-2-2 2 2-2 2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span>{SITE_NAME.slice(0, 6)}<span className="text-accent">{SITE_NAME.slice(6)}</span></span>
        </Link>
        <nav className="hidden flex-1 items-center gap-6 text-[13px] lg:flex">
          {NAV.map((item) => {
            const active = item.href === "/#tools" ? path === "/tools" : false;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex h-14 items-center border-b-2 border-transparent font-medium text-mute transition duration-180 hover:text-ink",
                  active && "border-accent text-ink",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <Link
          href={path === "/" ? "/#converter" : "/#tools"}
          className="ml-auto shrink-0 rounded-xl bg-ink px-4 py-2 text-xs font-semibold text-white shadow-sm transition duration-180 hover:-translate-y-0.5 hover:bg-accent active:scale-[0.98]"
        >
          {path === "/" ? "Start converting" : "Browse tools"}
        </Link>
      </Container>
    </header>
  );
}
