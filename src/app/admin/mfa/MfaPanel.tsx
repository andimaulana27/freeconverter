"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

function safeNext(path: string | null) {
  if (path && path.startsWith("/admin") && !path.startsWith("//") && !path.includes("://")) {
    return path;
  }
  return "/admin";
}

export function MfaPanel({ nextPath }: { nextPath: string | null }) {
  const router = useRouter();
  const [mode, setMode] = useState<"challenge" | "enroll">("challenge");
  const [factorId, setFactorId] = useState("");
  const [qr, setQr] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      const supabase = createBrowserSupabaseClient();
      const factors = await supabase.auth.mfa.listFactors();
      const verified = factors.data?.totp.find((factor) => factor.status === "verified");
      if (!active) return;
      if (verified) {
        setMode("challenge");
        setFactorId(verified.id);
        return;
      }

      const enrolled = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "AllYouConvert admin" });
      if (!active) return;
      if (enrolled.error || !enrolled.data.totp) {
        setError(enrolled.error?.message ?? "Could not start authenticator enrollment.");
        return;
      }
      setMode("enroll");
      setFactorId(enrolled.data.id);
      setQr(enrolled.data.totp.qr_code);
      setSecret(enrolled.data.totp.secret);
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const challenge = await supabase.auth.mfa.challenge({ factorId });
      if (challenge.error) {
        setError(challenge.error.message);
        return;
      }
      const verified = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.data.id,
        code,
      });
      if (verified.error) {
        setError(verified.error.message);
        return;
      }
      router.replace(safeNext(nextPath));
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Verification failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      {error ? <p role="alert" className="rounded-control border border-accent/30 bg-accent-soft px-3 py-2 text-sm text-accent-ink">{error}</p> : null}
      {mode === "enroll" ? (
        <div className="space-y-3 rounded-2xl border border-[#e5ddda] bg-[#faf8f7] p-4">
          <p className="text-sm text-mute">Scan this QR code with an authenticator app, then enter the 6-digit code.</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {qr ? <img src={qr} alt="Authenticator QR code" className="mx-auto h-40 w-40 rounded-control border border-line bg-white p-2 shadow-drop" /> : null}
          {secret ? <p className="break-all rounded-lg bg-white px-3 py-2 font-mono text-xs text-faint">{secret}</p> : null}
        </div>
      ) : (
        <div className="flex items-start gap-3 rounded-2xl border border-[#e5ddda] bg-[#faf8f7] p-4">
          <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-[#55d69a] shadow-[0_0_0_4px_rgba(85,214,154,0.1)]" />
          <p className="text-sm leading-6 text-mute">Enter the current six-digit code from your authenticator app.</p>
        </div>
      )}
      <label className="flex flex-col gap-2 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-faint">
        Verification code
        <input
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          pattern="[0-9]*"
          required
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="000 000"
          className="h-14 rounded-control border border-[#ddd6d2] bg-white px-4 text-center font-mono text-lg tracking-[0.34em] text-ink outline-none transition placeholder:text-[#c9c1bd] focus:border-accent focus:shadow-glow"
        />
      </label>
      <Button type="submit" size="lg" className="w-full justify-between" loading={loading} disabled={!factorId}>
        Verify and continue <span aria-hidden>→</span>
      </Button>
    </form>
  );
}
