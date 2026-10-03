import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/app/admin/login/LoginForm";
import { Logo } from "@/components/layout/Logo";
import { hasSupabasePublicConfig } from "@/lib/supabase/env";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

const ERRORS: Record<string, string> = {
  forbidden: "This account does not have admin access.",
  config: "Supabase environment variables are missing.",
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const configured = hasSupabasePublicConfig();

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f4f1ef] p-3 sm:p-5 lg:p-7">
      <div
        className="pointer-events-none absolute inset-0 opacity-55 [background-image:linear-gradient(rgba(24,20,18,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(24,20,18,0.035)_1px,transparent_1px)] [background-size:52px_52px]"
        aria-hidden
      />
      <div className="pointer-events-none absolute -left-32 top-1/3 h-80 w-80 rounded-full bg-accent/10 blur-3xl" aria-hidden />

      <div className="relative mx-auto grid min-h-[calc(100vh-1.5rem)] w-full max-w-[1320px] overflow-hidden rounded-[28px] border border-black/10 bg-paper shadow-panel sm:min-h-[calc(100vh-2.5rem)] sm:rounded-panel lg:min-h-[calc(100vh-3.5rem)] lg:grid-cols-[1.08fr_0.92fr]">
        <section className="group relative isolate flex min-h-[390px] flex-col overflow-hidden bg-[#181412] p-6 text-white sm:p-9 lg:min-h-0 lg:p-12">
          <div
            className="pointer-events-none absolute inset-0 -z-20 opacity-35 [background-image:linear-gradient(rgba(255,255,255,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.055)_1px,transparent_1px)] [background-size:48px_48px]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-y-0 right-0 -z-10 w-[34rem] opacity-35 [background-image:radial-gradient(circle,rgba(255,106,100,0.62)_1px,transparent_1.2px)] [background-size:11px_11px] [mask-image:linear-gradient(to_left,black,transparent_82%)]"
            aria-hidden
          />
          <div className="pointer-events-none absolute -right-28 -top-32 -z-10 h-80 w-80 rounded-full border-[48px] border-white/[0.035] transition duration-700 group-hover:scale-105" aria-hidden />
          <div className="pointer-events-none absolute bottom-20 right-12 -z-10 h-32 w-32 rounded-full bg-accent/15 blur-3xl" aria-hidden />

          <Link href="/" className="group/brand flex w-fit items-center gap-4 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-accent-light" aria-label="AllYouConvert home">
            <Logo variant="light" priority className="h-auto max-w-[178px] transition duration-280 group-hover/brand:-translate-y-0.5 sm:max-w-[196px]" />
            <span className="hidden h-8 w-px bg-white/15 sm:block" aria-hidden />
            <span className="hidden font-mono text-[8px] uppercase leading-4 tracking-[0.2em] text-white/40 sm:block">
              Admin
              <br />
              system
            </span>
          </Link>

          <div className="my-auto max-w-xl py-12 lg:py-16">
            <p className="flex items-center gap-3 font-mono text-micro font-bold uppercase text-accent-light">
              <span className="h-px w-8 bg-accent-light" />
              Private operations desk
            </p>
            <h2 className="mt-5 text-[2.65rem] font-semibold leading-[0.96] tracking-[-0.06em] sm:text-6xl lg:text-[4rem]">
              Publish with context.
              <br />
              Manage with control.
            </h2>
            <p className="mt-6 max-w-md text-sm leading-7 text-white/52">
              One protected workspace for editorial flow, campaign placement, and the decisions behind every public release.
            </p>
          </div>

          <div className="grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-3">
            {[
              ["01", "Content", "Draft to publish"],
              ["02", "Campaigns", "Place with intent"],
              ["03", "Access", "Role protected"],
            ].map(([number, title, note]) => (
              <div key={number} className="bg-[#1e1917]/90 p-4 transition duration-280 hover:bg-white/[0.07]">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-[9px] text-accent-light">{number}</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-[#55d69a] shadow-[0_0_0_4px_rgba(85,214,154,0.08)]" />
                </div>
                <p className="mt-4 text-xs font-semibold">{title}</p>
                <p className="mt-1 text-[10px] text-white/38">{note}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="relative flex items-center px-6 py-10 sm:px-10 sm:py-14 lg:px-14 xl:px-20">
          <div className="pointer-events-none absolute right-8 top-8 font-mono text-[9px] uppercase tracking-[0.18em] text-faint">
            Staff only / no signup
          </div>

          <div className="mx-auto w-full max-w-[430px]">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#e3dcda] bg-[#f7f3f1] text-accent shadow-drop">
              <ShieldIcon />
            </div>
            <p className="mt-7 font-mono text-micro font-bold uppercase tracking-[0.16em] text-accent">Secure access</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.055em] text-ink sm:text-5xl">Welcome back.</h1>
            <p className="mt-4 max-w-sm text-sm leading-6 text-mute">
              Sign in with your assigned staff account to continue to the AllYouConvert admin workspace.
            </p>

            <div className="mt-8">
              {configured ? (
                <LoginForm nextPath={params.next ?? null} initialError={params.error ? ERRORS[params.error] ?? "" : ""} />
              ) : (
                <div role="alert" className="rounded-tile border border-accent/20 bg-accent-soft p-5">
                  <p className="text-sm font-semibold text-accent-ink">Admin access is not configured</p>
                  <p className="mt-2 text-xs leading-5 text-accent-ink/70">
                    The sign-in service is not ready. Ask the site administrator to finish the secure access setup.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-8 flex items-center gap-3 border-t border-line pt-5">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-[#e7f8ef] text-[#16885c]">
                <CheckIcon />
              </span>
              <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-faint">
                Encrypted session · Role-gated access
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <path d="M12 3.5 19 6v5.4c0 4.2-2.8 7.4-7 9.1-4.2-1.7-7-4.9-7-9.1V6z" strokeLinejoin="round" />
      <path d="M9.5 11.5v-1a2.5 2.5 0 0 1 5 0v1M9 11.5h6v4H9z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="m5.5 10 3 3 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
