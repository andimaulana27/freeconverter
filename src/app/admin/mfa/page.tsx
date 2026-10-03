import type { Metadata } from "next";
import { MfaPanel } from "@/app/admin/mfa/MfaPanel";
import { Logo } from "@/components/layout/Logo";

export const metadata: Metadata = {
  title: "Admin authenticator",
  robots: { index: false, follow: false },
};

export default async function AdminMfaPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="relative flex min-h-screen items-center overflow-hidden bg-[#f4f1ef] p-4 sm:p-7">
      <div className="pointer-events-none absolute inset-0 opacity-55 [background-image:linear-gradient(rgba(24,20,18,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(24,20,18,0.035)_1px,transparent_1px)] [background-size:52px_52px]" aria-hidden />
      <div className="relative mx-auto grid w-full max-w-5xl overflow-hidden rounded-[28px] border border-black/10 bg-white shadow-panel lg:grid-cols-[0.85fr_1.15fr]">
        <section className="relative isolate overflow-hidden bg-[#181412] p-7 text-white sm:p-10">
          <div className="pointer-events-none absolute inset-0 -z-20 opacity-30 [background-image:radial-gradient(circle,rgba(255,106,100,0.65)_1px,transparent_1.2px)] [background-size:11px_11px] [mask-image:linear-gradient(to_bottom_left,black,transparent)]" aria-hidden />
          <Logo variant="light" priority className="h-auto max-w-[184px]" />
          <div className="mt-16">
            <p className="font-mono text-micro font-bold uppercase text-accent-light">Identity checkpoint</p>
            <h1 className="mt-5 text-4xl font-semibold leading-[0.98] tracking-[-0.055em]">One more proof before access.</h1>
            <p className="mt-5 text-sm leading-6 text-white/48">Your password opens the door. The authenticator confirms it is really you.</p>
          </div>
          <p className="mt-14 font-mono text-[8px] uppercase tracking-[0.16em] text-white/25">Staff only · Authenticator protected</p>
        </section>
        <section className="flex items-center p-6 sm:p-10 lg:p-14">
          <div className="w-full">
            <p className="font-mono text-micro font-bold uppercase tracking-[0.16em] text-accent">Secure access</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.05em]">Authenticator</h2>
            <p className="mt-3 text-sm leading-6 text-mute">Enter the code from your authenticator app to continue.</p>
            <div className="mt-7">
              <MfaPanel nextPath={params.next ?? null} />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
