"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const LINKS = [
  { href: "/admin", label: "Dashboard", match: "exact" as const },
  { href: "/admin/posts", label: "Guides", match: "prefix" as const },
  { href: "/admin/generate", label: "Generate", match: "prefix" as const },
  { href: "/admin/ads", label: "Ads", match: "prefix" as const },
  { href: "/admin/security", label: "Security", match: "prefix" as const },
];

export function AdminNav({ showCms, showAds }: { showCms: boolean; showAds: boolean }) {
  const pathname = usePathname();
  const links = LINKS.filter((link) => {
    if (link.href === "/admin/posts" || link.href === "/admin/generate") return showCms;
    if (link.href === "/admin/ads") return showAds;
    return true;
  });

  return (
    <nav aria-label="Admin" className="flex flex-wrap gap-1 lg:flex-col">
      {links.map((link) => {
        const active = link.match === "exact" ? pathname === link.href : pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-control px-3 py-2 text-sm font-medium transition",
              active ? "bg-accent-soft text-accent-ink" : "text-mute hover:bg-bone hover:text-ink",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
