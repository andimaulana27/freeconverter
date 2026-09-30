"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { Container } from "@/components/ui/Container";

const NAV = [
  { href: "/", label: "Convert" },
  { href: "/tools", label: "Tools" },
  { href: "/#gambar", label: "Gambar" },
  { href: "/#pdf", label: "PDF" },
  { href: "/#font", label: "Font" },
];

export function Header() {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-20 border-b border-line/80 bg-bone/80 backdrop-blur-md">
      <Container className="flex items-center gap-5 py-3">
        <Link href="/" className="shrink-0 text-[15px] font-semibold tracking-tight text-ink transition duration-180 hover:text-accent-ink">
          FreeConverter
        </Link>
        <nav className="flex flex-1 items-center gap-0.5 overflow-x-auto text-sm">
          {NAV.map((item) => {
            const active = item.href === "/" ? path === "/" : item.href.startsWith("/#") ? false : path === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-full px-3 py-1.5 text-mute transition duration-180 hover:bg-paper hover:text-ink",
                  active && "bg-paper text-ink shadow-sm",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <p className="hidden shrink-0 text-xs text-faint sm:block">No account · on this device</p>
      </Container>
    </header>
  );
}
