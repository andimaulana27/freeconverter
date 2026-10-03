import type { ReactNode } from "react";
import { AdminNav } from "@/app/admin/AdminNav";
import { signOutAdmin } from "@/app/admin/actions";
import { Button } from "@/components/ui/Button";
import { canUseCms, roleLabel, type StaffRole } from "@/lib/auth/roles";

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
    <div className="min-h-screen lg:grid lg:grid-cols-[15.5rem_minmax(0,1fr)]">
      <aside className="border-b border-line bg-paper px-5 py-5 lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r lg:px-5 lg:py-6">
        <div className="flex items-start justify-between gap-4 lg:block">
          <div>
            <p className="font-mono text-micro font-bold uppercase tracking-[0.16em] text-accent">Admin</p>
            <p className="mt-1 text-base font-semibold tracking-tight">AllYouConvert</p>
          </div>
          <form action={signOutAdmin} className="lg:hidden">
            <Button type="submit" variant="secondary" size="sm">
              Sign out
            </Button>
          </form>
        </div>
        <div className="mt-5">
          <AdminNav showCms={canUseCms(role)} />
        </div>
        <div className="mt-6 hidden text-xs text-mute lg:block">
          <p className="truncate text-sm text-ink">{email}</p>
          <p className="mt-1">
            {roleLabel(role)} · {currentAal.toUpperCase()}
          </p>
          <form action={signOutAdmin} className="mt-4">
            <Button type="submit" variant="secondary" size="sm">
              Sign out
            </Button>
          </form>
        </div>
      </aside>
      <div className="min-w-0 px-5 py-6 sm:px-8">{children}</div>
    </div>
  );
}
