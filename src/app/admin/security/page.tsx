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
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4 rounded-[22px] border border-black/[0.07] bg-white p-6 shadow-tile">
        <div>
          <p className="flex items-center gap-2 font-mono text-micro font-bold uppercase text-accent"><span className="h-px w-6 bg-accent" /> Account protection</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.055em]">Security</h1>
          <p className="mt-2 max-w-xl text-sm text-mute">Keep credentials current and verify stronger access with a second factor.</p>
        </div>
        <span className="flex items-center gap-2 rounded-full border border-[#bde8d5] bg-[#e7f8ef] px-3 py-2 font-mono text-[9px] font-bold uppercase text-[#16885c]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#55d69a]" />
          {session.currentAal === "aal2" ? "Two-step sign-in active" : "Standard sign-in active"}
        </span>
      </div>

      <div className="grid items-stretch gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="rounded-[22px] border border-black/[0.07] bg-white p-6 shadow-tile sm:p-8">
          <p className="font-mono text-micro font-bold uppercase tracking-[0.16em] text-accent">Credentials</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">Change password</h2>
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

          <form action={changeAdminPassword} className="mt-7 flex max-w-xl flex-col gap-5">
            <label className="flex flex-col gap-2 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-faint">
              Current password
              <input
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                required
                className="h-12 rounded-control border border-[#ddd6d2] bg-white px-4 font-sans text-sm normal-case tracking-normal text-ink outline-none transition focus:border-accent focus:shadow-glow"
              />
            </label>
            <label className="flex flex-col gap-2 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-faint">
              New password
              <input
                name="newPassword"
                type="password"
                autoComplete="new-password"
                minLength={12}
                required
                aria-describedby="new-password-help"
                className="h-12 rounded-control border border-[#ddd6d2] bg-white px-4 font-sans text-sm normal-case tracking-normal text-ink outline-none transition focus:border-accent focus:shadow-glow"
              />
              <span id="new-password-help" className="font-sans text-[10px] font-normal normal-case tracking-normal text-faint">
                Use at least 12 characters and do not reuse the current password.
              </span>
            </label>
            <label className="flex flex-col gap-2 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-faint">
              Confirm new password
              <input
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                minLength={12}
                required
                className="h-12 rounded-control border border-[#ddd6d2] bg-white px-4 font-sans text-sm normal-case tracking-normal text-ink outline-none transition focus:border-accent focus:shadow-glow"
              />
            </label>
            <div>
              <Button type="submit" size="lg">Update password <span aria-hidden>→</span></Button>
            </div>
          </form>
        </section>

        <aside className="relative isolate flex h-full min-h-[28rem] flex-col overflow-hidden rounded-[22px] border border-white/10 bg-[#181412] p-6 text-white shadow-panel-dark">
          <div className="pointer-events-none absolute inset-0 -z-10 opacity-30 [background-image:radial-gradient(circle,rgba(255,106,100,0.65)_1px,transparent_1.2px)] [background-size:10px_10px] [mask-image:linear-gradient(to_bottom_left,black,transparent)]" aria-hidden />
          <span className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/[0.07] text-accent-light">
            <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
              <path d="M10 2.75 16 5v4.6c0 3.6-2.4 6.3-6 7.75-3.6-1.45-6-4.15-6-7.75V5z" strokeLinejoin="round" />
              <path d="M7.5 9.5v-1a2.5 2.5 0 0 1 5 0v1M7 9.5h6v4H7z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <p className="mt-6 font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-accent-light">Second factor</p>
          <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em]">Authenticator</h2>
          <p className="mt-3 text-sm leading-6 text-white/48">Use an authenticator app on your phone for stronger protection of this admin account.</p>
          <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-3">
            <p className="font-mono text-[8px] uppercase tracking-[0.13em] text-white/35">Current protection</p>
            <p className="mt-1 text-sm font-semibold">{session.currentAal === "aal2" ? "Password + authenticator" : "Password only"}</p>
          </div>
          <div className="mt-auto pt-8">
            <p className="mb-3 text-[10px] leading-5 text-white/35">Recommended for every account that can publish content or manage advertising.</p>
            <ButtonLink href="/admin/mfa?next=/admin/security" variant="secondary" className="w-full border-white/10 bg-white/[0.07] text-white hover:border-white/20 hover:bg-white/10">
            Manage authenticator
            </ButtonLink>
          </div>
        </aside>
      </div>
    </AdminChrome>
  );
}
