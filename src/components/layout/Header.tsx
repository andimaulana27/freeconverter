"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { SITE_NAME } from "@/lib/site";
import { ButtonAnchor, ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Logo } from "@/components/layout/Logo";

const NAV = [
  { href: "/#tools", label: "All tools", index: "01" },
  { href: "/#gambar", label: "Images", index: "02" },
  { href: "/#pdf", label: "PDF", index: "03" },
  { href: "/#dokumen", label: "Documents", index: "04" },
  { href: "/#utilitas", label: "Utilities", index: "05" },
];

const DONATE_URL = "https://www.paypal.com/paypalme/HeruUtamaPutra";

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

      <Container className="flex h-[72px] w-[calc(100%_-_2rem)] max-w-[1440px] items-center gap-4 px-0 sm:w-[calc(100%_-_3rem)] sm:gap-6 sm:px-0">
        <Link href="/" className="group flex shrink-0 items-center text-ink" aria-label={`${SITE_NAME} home`}>
          <Logo priority className="max-w-[118px] transition duration-280 group-hover:-translate-y-0.5 sm:max-w-[168px]" />
        </Link>

        <span className="hidden h-7 w-px shrink-0 bg-[#ddd6d2] sm:block" aria-hidden />

        <nav className="hidden h-full flex-1 items-stretch gap-1 text-[12px] lg:flex" aria-label="Primary navigation">
          {NAV.map((item) => {
            const active = item.href === "/#tools" && path === "/tools";
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
                <span className="font-mono text-micro font-medium text-[#8f8782] transition group-hover:text-accent">{item.index}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <ButtonAnchor
          href={DONATE_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Donate via PayPal (opens in a new tab)"
          title="Donate via PayPal"
          variant="support"
          size="icon"
          className="ml-auto sm:w-auto sm:gap-2 sm:px-3.5 lg:ml-0"
        >
          <svg
            viewBox="0 0 20 20"
            className="h-4 w-4 transition duration-280 group-hover:scale-110 group-hover:fill-current group-focus-visible:fill-current"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            aria-hidden
          >
            <path
              d="M10 16.3 3.9 10.5a3.8 3.8 0 0 1-.2-5.2 3.5 3.5 0 0 1 5.1-.1L10 6.4l1.2-1.2a3.5 3.5 0 0 1 5.1.1 3.8 3.8 0 0 1-.2 5.2L10 16.3Z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="hidden text-xs font-bold sm:inline">Donate</span>
        </ButtonAnchor>

        <ButtonLink
          href={path === "/" ? "/#converter" : "/#tools"}
          variant="primary"
          size="md"
          className="my-auto px-3.5 text-xs font-bold sm:px-4"
        >
          <span className="sm:hidden">{path === "/" ? "Convert" : "Tools"}</span>
          <span className="hidden sm:inline">{path === "/" ? "Start converting" : "Browse tools"}</span>
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 transition duration-180 group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <path d="M2.5 8h10m-4-4 4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </ButtonLink>
      </Container>
    </header>
  );
}
