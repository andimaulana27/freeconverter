import type { ReactNode } from "react";
import Link from "next/link";
import { AdminNav } from "@/app/admin/AdminNav";
import { signOutAdmin } from "@/app/admin/actions";
import { Logo } from "@/components/layout/Logo";
import { Button } from "@/components/ui/Button";
import { canManageAds, canUseCms, roleLabel, type StaffRole } from "@/lib/auth/roles";

export function AdminChrome({
  email,
  role,
  currentAal,
  children,
}: {
  email: string;
  role: StaffRole;
  currentAal: string;
  children: ReactNode;
}) {
  return (
    <div className="admin-workspace min-h-screen bg-[#f3f0ee] lg:grid lg:grid-cols-[17.5rem_minmax(0,1fr)]">
      <aside className="relative isolate overflow-hidden border-b border-white/10 bg-[#181412] px-4 py-4 text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:border-b-0 lg:border-r lg:border-white/10 lg:px-5 lg:py-6">
        <div
          className="pointer-events-none absolute inset-0 -z-20 opacity-25 [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:42px_42px]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 -z-10 w-52 opacity-25 [background-image:radial-gradient(circle,rgba(255,106,100,0.7)_1px,transparent_1.2px)] [background-size:10px_10px] [mask-image:linear-gradient(to_left,black,transparent)]"
          aria-hidden
        />

        <div className="flex items-center justify-between gap-4">
          <Link href="/admin" className="group/logo flex min-w-0 items-center gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-accent-light" aria-label="AllYouConvert admin dashboard">
            <Logo variant="light" priority className="h-auto max-w-[146px] transition duration-280 group-hover/logo:-translate-y-0.5 lg:max-w-[158px]" />
            <span className="hidden h-7 w-px bg-white/15 sm:block lg:hidden xl:block" aria-hidden />
            <span className="hidden font-mono text-[7px] uppercase leading-3 tracking-[0.18em] text-white/35 sm:block lg:hidden xl:block">
              Admin
              <br />
              desk
            </span>
          </Link>
          <form action={signOutAdmin} className="lg:hidden">
            <Button type="submit" variant="ghost" size="sm" className="text-white/60 hover:bg-white/10 hover:text-white">
              Exit
            </Button>
          </form>
        </div>

        <div className="mt-5 border-t border-white/10 pt-4 lg:mt-8 lg:pt-6">
          <p className="mb-3 hidden px-3 font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-white/30 lg:block">Workspace</p>
          <AdminNav showCms={canUseCms(role)} showAds={canManageAds(role)} />
        </div>

        <div className="mt-auto hidden pt-8 lg:block">
          <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10 text-xs font-bold text-white">
                {email.slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-white/90">{email}</p>
                <p className="mt-1 text-[9px] text-white/38">{roleLabel(role)}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
              <span className="flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.13em] text-white/38">
                <span className="h-1.5 w-1.5 rounded-full bg-[#55d69a] shadow-[0_0_0_3px_rgba(85,214,154,0.08)]" />
                {currentAal === "aal2" ? "Extra sign-in verified" : "Signed in securely"}
              </span>
              <form action={signOutAdmin}>
                <Button type="submit" variant="ghost" size="xs" className="text-white/45 hover:bg-white/10 hover:text-white">
                  Sign out
                </Button>
              </form>
            </div>
          </div>
          <p className="mt-4 px-1 font-mono text-[8px] uppercase tracking-[0.15em] text-white/20">Private staff environment</p>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="hidden h-16 items-center justify-between border-b border-black/[0.06] bg-white/70 px-6 backdrop-blur-xl sm:px-8 lg:flex">
          <div className="flex items-center gap-3">
            <span className="h-7 w-px bg-accent" />
            <div>
              <p className="font-mono text-[8px] font-bold uppercase tracking-[0.18em] text-faint">Admin workspace</p>
              <p className="mt-0.5 text-xs font-medium text-ink">Create, review, and publish.</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.14em] text-faint">
              <span className="h-1.5 w-1.5 rounded-full bg-[#55d69a]" />
              Workspace ready
            </span>
            <span className="h-5 w-px bg-line" />
            <span className="max-w-52 truncate text-xs text-mute">{email}</span>
          </div>
        </header>

        <main className="relative px-4 py-6 sm:px-7 sm:py-8 xl:px-10 xl:py-10">
          <div
            className="pointer-events-none absolute inset-0 -z-10 opacity-45 [background-image:radial-gradient(circle,rgba(24,20,18,0.08)_1px,transparent_1px)] [background-size:14px_14px] [mask-image:linear-gradient(to_bottom,black,transparent_22rem)]"
            aria-hidden
          />
          <div className="mx-auto w-full max-w-[1480px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
