import type { Metadata } from "next";
import { MfaPanel } from "@/app/admin/mfa/MfaPanel";

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
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5 py-12">
      <p className="font-mono text-micro font-bold uppercase tracking-[0.16em] text-accent">Admin</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Authenticator</h1>
      <p className="mt-2 text-sm text-mute">Complete MFA to continue. Enrolled accounts must verify a TOTP code at sign-in.</p>
      <div className="mt-8 rounded-tile border border-line bg-paper p-6 shadow-tile">
        <MfaPanel nextPath={params.next ?? null} />
      </div>
    </main>
  );
}
