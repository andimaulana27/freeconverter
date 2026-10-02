import type { Metadata } from "next";
import { LoginForm } from "@/app/admin/login/LoginForm";
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
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5 py-12">
      <p className="font-mono text-micro font-bold uppercase tracking-[0.16em] text-accent">Admin</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Sign in</h1>
      <p className="mt-2 text-sm text-mute">Staff access only. Public signup is disabled in this app.</p>
      <div className="mt-8 rounded-tile border border-line bg-paper p-6 shadow-tile">
        {configured ? (
          <LoginForm nextPath={params.next ?? null} initialError={params.error ? ERRORS[params.error] ?? "" : ""} />
        ) : (
          <p className="text-sm text-mute">Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY before signing in.</p>
        )}
      </div>
    </main>
  );
}
