"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const LINKS = [
  { href: "/admin", label: "Dashboard", note: "Overview & activity", icon: "dashboard", match: "exact" as const },
  { href: "/admin/posts", label: "Guides", note: "Editorial workflow", icon: "guides", match: "prefix" as const },
  { href: "/admin/media", label: "Media", note: "Covers and shared images", icon: "media", match: "prefix" as const },
  { href: "/admin/generate", label: "AI assistant", note: "Batch drafts and job progress", icon: "generate", match: "prefix" as const },
  { href: "/admin/growth", label: "Growth", note: "Quality, search, converter starts", icon: "growth", match: "prefix" as const },
  { href: "/admin/ads", label: "Ads", note: "Creative placement", icon: "ads", match: "prefix" as const },
  { href: "/admin/security", label: "Security", note: "Account protection", icon: "security", match: "prefix" as const },
];

export function AdminNav({ showCms, showAds }: { showCms: boolean; showAds: boolean }) {
  const pathname = usePathname();
  const links = LINKS.filter((link) => {
    if (link.href === "/admin/posts" || link.href === "/admin/generate" || link.href === "/admin/growth" || link.href === "/admin/media") return showCms;
    if (link.href === "/admin/ads") return showAds;
    return true;
  });

  return (
    <nav aria-label="Admin" className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0">
      {links.map((link, index) => {
        const active = link.match === "exact" ? pathname === link.href : pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group/nav relative flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 outline-none transition duration-180 focus-visible:ring-2 focus-visible:ring-accent-light lg:w-full lg:py-3",
              active
                ? "bg-white/[0.09] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                : "text-white/46 hover:bg-white/[0.055] hover:text-white/85",
            )}
          >
            <span
              className={cn(
                "grid h-8 w-8 shrink-0 place-items-center rounded-lg border transition duration-180",
                active
                  ? "border-accent/30 bg-accent text-white shadow-[0_8px_18px_rgba(217,45,40,0.22)]"
                  : "border-white/10 bg-white/[0.035] group-hover/nav:border-white/15 group-hover/nav:bg-white/[0.07]",
              )}
            >
              <NavIcon name={link.icon} />
            </span>
            <span className="text-left">
              <span className="block text-xs font-semibold">{link.label}</span>
              <span className="mt-0.5 hidden text-[9px] font-normal text-white/30 lg:block">{link.note}</span>
            </span>
            <span className="ml-auto hidden font-mono text-[8px] text-white/20 lg:block">0{index + 1}</span>
            {active ? <span className="absolute -left-2 top-1/2 hidden h-6 w-0.5 -translate-y-1/2 rounded-full bg-accent-light lg:block" /> : null}
          </Link>
        );
      })}
    </nav>
  );
}

function NavIcon({ name }: { name: string }) {
  if (name === "generate") {
    return (
      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
        <path d="M10 2.5c.55 3.1 1.8 4.35 5 5-3.2.65-4.45 1.9-5 5-.55-3.1-1.8-4.35-5-5 3.2-.65 4.45-1.9 5-5Z" strokeLinejoin="round" />
        <path d="M15.5 12.5c.25 1.4.85 2 2.25 2.25-1.4.3-2 .85-2.25 2.25-.3-1.4-.85-1.95-2.25-2.25 1.4-.25 1.95-.85 2.25-2.25Z" strokeLinejoin="round" />
      </svg>
    );
  }
  if (name === "guides") {
    return (
      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
        <path d="M4 3.5h8l4 4v9H4z" strokeLinejoin="round" />
        <path d="M12 3.5V8h4M7 11h6M7 14h4" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "growth") {
    return (
      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
        <path d="M3.5 14.5 8 10l3 3 5.5-6.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3.5 16.5h13" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "media") {
    return (
      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
        <rect x="3" y="4.5" width="14" height="11" rx="2" />
        <path d="m6 12 2.2-2.2 2.3 2.3L13 10.5 17 14.5" strokeLinejoin="round" />
        <circle cx="7.2" cy="8" r="1" />
      </svg>
    );
  }
  if (name === "ads") {
    return (
      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
        <rect x="2.5" y="4" width="15" height="12" rx="2" />
        <path d="M6 8h8M6 11h5M6 14h3" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "generate") {
    return (
      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
        <path d="M10 3.2 11.6 8H16l-3.7 2.8 1.4 4.8L10 12.9 6.3 15.6 7.7 10.8 4 8h4.4z" strokeLinejoin="round" />
      </svg>
    );
  }
  if (name === "security") {
    return (
      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
        <path d="M10 2.75 16 5v4.6c0 3.6-2.4 6.3-6 7.75-3.6-1.45-6-4.15-6-7.75V5z" strokeLinejoin="round" />
        <path d="m7.5 10 1.7 1.7 3.6-3.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <rect x="3" y="3" width="5" height="5" rx="1" />
      <rect x="12" y="3" width="5" height="5" rx="1" />
      <rect x="3" y="12" width="5" height="5" rx="1" />
      <rect x="12" y="12" width="5" height="5" rx="1" />
    </svg>
  );
}
