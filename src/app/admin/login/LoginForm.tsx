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
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {error ? <p className="rounded-control border border-accent/30 bg-accent-soft px-3 py-2 text-sm text-accent-ink">{error}</p> : null}
      {needsMfa ? (
        <label className="flex flex-col gap-1.5 text-sm text-mute">
          Authenticator code
          <input
            autoFocus
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(event) => setCode(event.target.value.trim())}
            className="h-10 rounded-control border border-line bg-bone px-3 text-sm text-ink outline-none focus:border-accent focus:shadow-glow"
          />
        </label>
      ) : (
        <>
          <label className="flex flex-col gap-1.5 text-sm text-mute">
            Email
            <input
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-10 rounded-control border border-line bg-bone px-3 text-sm text-ink outline-none focus:border-accent focus:shadow-glow"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm text-mute">
            Password
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-10 rounded-control border border-line bg-bone px-3 text-sm text-ink outline-none focus:border-accent focus:shadow-glow"
            />
          </label>
        </>
      )}
      <Button type="submit" loading={loading}>
        {needsMfa ? "Verify code" : "Sign in"}
      </Button>
    </form>
  );
}
