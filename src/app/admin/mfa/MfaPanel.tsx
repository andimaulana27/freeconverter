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
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {error ? <p className="rounded-control border border-accent/30 bg-accent-soft px-3 py-2 text-sm text-accent-ink">{error}</p> : null}
      {mode === "enroll" ? (
        <div className="space-y-3">
          <p className="text-sm text-mute">Scan this QR code with an authenticator app, then enter the 6-digit code.</p>
          {qr ? <img src={qr} alt="Authenticator QR code" className="mx-auto h-40 w-40 rounded-control border border-line bg-white p-2" /> : null}
          {secret ? <p className="break-all font-mono text-xs text-faint">{secret}</p> : null}
        </div>
      ) : (
        <p className="text-sm text-mute">Enter the current code from your authenticator app.</p>
      )}
      <label className="flex flex-col gap-1.5 text-sm text-mute">
        Authenticator code
        <input
          inputMode="numeric"
          autoComplete="one-time-code"
          required
          value={code}
          onChange={(event) => setCode(event.target.value.trim())}
          className="h-10 rounded-control border border-line bg-bone px-3 text-sm text-ink outline-none focus:border-accent focus:shadow-glow"
        />
      </label>
      <Button type="submit" loading={loading} disabled={!factorId}>
        Verify
      </Button>
    </form>
  );
}
