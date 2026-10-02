import type { Metadata } from "next";
import { AdminChrome } from "@/app/admin/AdminChrome";
import { changeAdminPassword } from "@/app/admin/security/actions";
import { Button, ButtonLink } from "@/components/ui/Button";
import { requireStaff } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Admin security",
  robots: { index: false, follow: false },
};

const STATUS_MESSAGES: Record<string, { tone: "error" | "success"; message: string }> = {
  "current-invalid": { tone: "error", message: "Current password is incorrect." },
  failed: { tone: "error", message: "Password could not be updated. Please try again." },
  mismatch: { tone: "error", message: "New password and confirmation do not match." },
  missing: { tone: "error", message: "Complete all password fields." },
  unchanged: { tone: "error", message: "Choose a new password that differs from the current password." },
  updated: { tone: "success", message: "Password updated successfully." },
  weak: { tone: "error", message: "New password must contain at least 12 characters." },
};

export default async function AdminSecurityPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await requireStaff("/admin/security");
  const params = await searchParams;
  const status = params.status ? STATUS_MESSAGES[params.status] : undefined;

  return (
    <AdminChrome email={session.email} role={session.role} currentAal={session.currentAal}>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <section className="rounded-tile border border-line bg-paper p-6">
          <p className="font-mono text-micro font-bold uppercase tracking-[0.16em] text-accent">Security</p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight">Change password</h2>
          <p className="mt-2 text-sm text-mute">
            Confirm your current password before setting a new password for this admin account.
          </p>

          {status ? (
            <p
              role={status.tone === "error" ? "alert" : "status"}
              className={`mt-5 rounded-control border px-3 py-2 text-sm ${
                status.tone === "error"
                  ? "border-accent/30 bg-accent-soft text-accent-ink"
                  : "border-line bg-bone text-ink"
              }`}
            >
              {status.message}
            </p>
          ) : null}

          <form action={changeAdminPassword} className="mt-6 flex max-w-lg flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-sm text-mute">
              Current password
              <input
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                required
                className="h-10 rounded-control border border-line bg-bone px-3 text-sm text-ink outline-none focus:border-accent focus:shadow-glow"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm text-mute">
              New password
              <input
                name="newPassword"
                type="password"
                autoComplete="new-password"
                minLength={12}
                required
                aria-describedby="new-password-help"
                className="h-10 rounded-control border border-line bg-bone px-3 text-sm text-ink outline-none focus:border-accent focus:shadow-glow"
              />
              <span id="new-password-help" className="text-xs text-faint">
                Use at least 12 characters and do not reuse the current password.
              </span>
            </label>
            <label className="flex flex-col gap-1.5 text-sm text-mute">
              Confirm new password
              <input
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                minLength={12}
                required
                className="h-10 rounded-control border border-line bg-bone px-3 text-sm text-ink outline-none focus:border-accent focus:shadow-glow"
              />
            </label>
            <div>
              <Button type="submit">Update password</Button>
            </div>
          </form>
        </section>

        <aside className="h-fit rounded-tile border border-line bg-paper p-5">
          <h2 className="text-base font-semibold">Authenticator</h2>
          <p className="mt-2 text-sm text-mute">
            Current assurance level: <span className="font-semibold text-ink">{session.currentAal.toUpperCase()}</span>
          </p>
          <p className="mt-2 text-sm text-mute">
            Enroll or verify TOTP for stronger protection of this admin account.
          </p>
          <ButtonLink href="/admin/mfa?next=/admin/security" variant="secondary" className="mt-4">
            Manage authenticator
          </ButtonLink>
        </aside>
      </div>
    </AdminChrome>
  );
}
