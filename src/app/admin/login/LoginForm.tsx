"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { isStaffRole, readUserRole } from "@/lib/auth/roles";
import { Button } from "@/components/ui/Button";

function safeNext(path: string | null) {
  if (path && path.startsWith("/admin") && !path.startsWith("//") && !path.includes("://")) {
    return path;
  }
  return "/admin";
}

export function LoginForm({ nextPath, initialError }: { nextPath: string | null; initialError?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState(initialError ?? "");
  const [needsMfa, setNeedsMfa] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createBrowserSupabaseClient();

      if (!needsMfa) {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
          setError(signInError.message);
          return;
        }
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      const role = readUserRole(user);
      if (!user || !isStaffRole(role)) {
        await supabase.auth.signOut();
        setError("This account does not have admin access.");
        return;
      }

      const assurance = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (assurance.data?.nextLevel === "aal2" && assurance.data.currentLevel !== "aal2") {
        if (!needsMfa) {
          setNeedsMfa(true);
          return;
        }

        const factors = await supabase.auth.mfa.listFactors();
        const totpFactor = factors.data?.totp[0];
        if (!totpFactor) {
          router.replace("/admin/mfa");
          router.refresh();
          return;
        }

        const challenge = await supabase.auth.mfa.challenge({ factorId: totpFactor.id });
        if (challenge.error) {
          setError(challenge.error.message);
          return;
        }

        const verified = await supabase.auth.mfa.verify({
          factorId: totpFactor.id,
          challengeId: challenge.data.id,
          code,
        });
        if (verified.error) {
          setError(verified.error.message);
          return;
        }
      }

      router.replace(safeNext(nextPath));
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Sign-in failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      {error ? (
        <div role="alert" className="flex gap-3 rounded-control border border-accent/25 bg-accent-soft px-3.5 py-3 text-accent-ink">
          <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent text-[11px] font-bold text-white" aria-hidden>
            !
          </span>
          <p className="text-xs leading-5">{error}</p>
        </div>
      ) : null}

      {needsMfa ? (
        <>
          <div className="rounded-2xl border border-[#e6dedb] bg-[#f8f5f3] p-4">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-ink text-white">
                <LockIcon />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">One more security check</p>
                <p className="mt-1 text-xs leading-5 text-mute">Enter the six-digit code from your authenticator app.</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="admin-auth-code" className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-faint">
              Authenticator code
            </label>
            <div className="group relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-faint transition group-focus-within:text-accent">
                <KeyIcon />
              </span>
              <input
                id="admin-auth-code"
                autoFocus
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                pattern="[0-9]*"
                required
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                aria-invalid={Boolean(error)}
                placeholder="000 000"
                className="h-14 w-full rounded-control border border-[#ddd6d2] bg-white pl-12 pr-4 font-mono text-lg tracking-[0.34em] text-ink outline-none transition duration-180 placeholder:text-[#c9c1bd] focus:border-accent focus:shadow-glow"
              />
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            <label htmlFor="admin-email" className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-faint">
              Email address
            </label>
            <div className="group relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-faint transition group-focus-within:text-accent">
                <MailIcon />
              </span>
              <input
                id="admin-email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                aria-invalid={Boolean(error)}
                placeholder="name@allyouconvert.com"
                className="h-14 w-full rounded-control border border-[#ddd6d2] bg-white pl-12 pr-4 text-sm text-ink outline-none transition duration-180 placeholder:text-[#aaa29e] focus:border-accent focus:shadow-glow"
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="admin-password" className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-faint">
              Password
            </label>
            <div className="group relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-faint transition group-focus-within:text-accent">
                <LockIcon />
              </span>
              <input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-invalid={Boolean(error)}
                placeholder="Enter your password"
                className="h-14 w-full rounded-control border border-[#ddd6d2] bg-white pl-12 pr-14 text-sm text-ink outline-none transition duration-180 placeholder:text-[#aaa29e] focus:border-accent focus:shadow-glow"
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                className="absolute right-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-lg text-faint outline-none transition hover:bg-[#f4efed] hover:text-ink focus-visible:ring-2 focus-visible:ring-accent"
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>
        </>
      )}

      <Button type="submit" size="lg" className="mt-1 w-full justify-between px-5" loading={loading}>
        <span>{needsMfa ? "Verify and continue" : "Enter admin workspace"}</span>
        <ArrowIcon />
      </Button>

      <div className="flex items-center justify-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-[#55d69a]" />
        <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-faint">Protected staff session</p>
      </div>
    </form>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <rect x="2.75" y="4.25" width="14.5" height="11.5" rx="2" />
      <path d="m4 6 6 4.5L16 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <rect x="3.5" y="8.25" width="13" height="9" rx="2" />
      <path d="M6.5 8.25V6.5a3.5 3.5 0 0 1 7 0v1.75M10 12v1.75" strokeLinecap="round" />
    </svg>
  );
}

function KeyIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <circle cx="7" cy="10" r="3.25" />
      <path d="m10 10 7-7M14 6l2 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M2.25 10s2.8-4.25 7.75-4.25S17.75 10 17.75 10 14.95 14.25 10 14.25 2.25 10 2.25 10Z" />
      <circle cx="10" cy="10" r="2" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="m3 3 14 14M8.6 5.9A8.8 8.8 0 0 1 10 5.75c4.95 0 7.75 4.25 7.75 4.25a12 12 0 0 1-2.1 2.45M11.65 14.1a8.6 8.6 0 0 1-1.65.15C5.05 14.25 2.25 10 2.25 10A12.5 12.5 0 0 1 5 6.95" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 transition duration-180 group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M3.5 10h13M12 5.5l4.5 4.5-4.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
