import type { ReactNode } from "react";
import { roleLabel, type StaffRole } from "@/lib/auth/roles";
import { signOutAdmin } from "@/app/admin/actions";
import { Button, ButtonLink } from "@/components/ui/Button";

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
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-5 py-8 sm:px-6">
      <header className="mb-8 border-b border-line pb-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-mono text-micro font-bold uppercase tracking-[0.16em] text-accent">Admin</p>
            <h1 className="mt-1 text-lg font-semibold tracking-tight">AllYouConvert</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="text-mute">{email}</span>
            <span className="rounded-control border border-line bg-paper px-2 py-1 text-xs font-semibold">{roleLabel(role)}</span>
            <span className="text-xs text-faint">{currentAal.toUpperCase()}</span>
            <form action={signOutAdmin}>
              <Button type="submit" variant="secondary" size="sm">
                Sign out
              </Button>
            </form>
          </div>
        </div>
        <nav aria-label="Admin navigation" className="mt-4 flex flex-wrap gap-2">
          <ButtonLink href="/admin">Dashboard</ButtonLink>
          <ButtonLink href="/admin/security">Security</ButtonLink>
        </nav>
      </header>
      {children}
    </div>
  );
}
