"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { rotateGoogleKeyAction, setGoogleSecretActiveAction, testGoogleConnectionAction } from "@/app/admin/generate/actions";
import { Button } from "@/components/ui/Button";
import type { GenerationHealth } from "@/lib/ai/types";

export function ProviderHealthCard({ health }: { health: GenerationHealth }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const connected = health.configured && !health.disabled && health.health !== "degraded";
  const status = !health.configured
    ? "Not connected"
    : health.disabled
      ? "Temporarily disabled"
      : health.health === "degraded"
        ? "Connection needs attention"
        : health.health === "healthy"
          ? "Connected and ready"
          : "Connected · not tested yet";

  return (
    <div className="rounded-[18px] border border-white/10 bg-[#181412] p-4 text-white shadow-panel-dark">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setBusy(true);
          setMessage("");
          void testGoogleConnectionAction().then((result) => {
            setBusy(false);
            setMessage(result.ok ? result.message ?? "Connected." : result.error);
            if (result.ok) router.refresh();
          });
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className={`grid h-10 w-10 place-items-center rounded-xl ${connected ? "bg-[#55d69a]/15 text-[#75e0b1]" : "bg-accent/15 text-accent-light"}`}>
              <ConnectionIcon connected={connected} />
            </span>
            <div>
              <p className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-white/40">AI connection</p>
              <p className="mt-1 text-sm font-semibold">{status}</p>
            </div>
          </div>
          <span className={`flex items-center gap-2 rounded-full border px-2.5 py-1 font-mono text-[8px] uppercase ${connected ? "border-[#55d69a]/20 bg-[#55d69a]/10 text-[#75e0b1]" : "border-accent-light/20 bg-accent/10 text-accent-light"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${connected ? "bg-[#55d69a]" : "bg-accent-light"}`} />
            {health.source === "vault" ? "Vault" : "Google AI"}
          </span>
        </div>
        <p className="mt-4 text-xs leading-5 text-white/50">
          Keys are stored in Vault or the server environment. The value is never shown in the browser after save.
        </p>
        {health.lastTestedAt ? <p className="mt-2 text-[10px] text-white/35">Last checked {new Date(health.lastTestedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</p> : null}
        {health.lastError ? <p className="mt-2 text-xs text-accent-light">{health.lastError}</p> : null}
        {message ? <p className="mt-2 text-xs text-white/70">{message}</p> : null}
        <div className="mt-4 flex items-center justify-between gap-3">
          <Button type="submit" variant="secondary" size="sm" loading={busy} className="border-white/10 bg-white/[0.07] text-white hover:bg-white/10">
            Check connection
          </Button>
          {health.maskedSuffix ? <span className="font-mono text-[8px] text-white/25">Active ending ···{health.maskedSuffix}</span> : null}
        </div>
      </form>

      {health.keys.length ? (
        <ul className="mt-4 space-y-2 border-t border-white/10 pt-4">
          {health.keys.map((key) => (
            <li key={key.id} className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-white/70">
                {key.kind === "vault" ? "Vault" : "Environment"} ···{key.maskedSuffix} · {key.isActive ? key.health : "inactive"}
              </span>
              <button
                type="button"
                className="font-mono text-[8px] uppercase tracking-[0.12em] text-white/45 hover:text-white"
                onClick={() => {
                  setBusy(true);
                  void setGoogleSecretActiveAction(key.secretRef, !key.isActive).then((result) => {
                    setBusy(false);
                    setMessage(result.ok ? result.message ?? "Updated." : result.error);
                    if (result.ok) router.refresh();
                  });
                }}
              >
                {key.isActive ? "Deactivate" : "Activate"}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <form
        className="mt-4 border-t border-white/10 pt-4"
        onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const apiKey = String(new FormData(form).get("apiKey") ?? "");
          setBusy(true);
          setMessage("");
          void rotateGoogleKeyAction(apiKey).then((result) => {
            setBusy(false);
            setMessage(result.ok ? result.message ?? "Stored." : result.error);
            if (result.ok) {
              form.reset();
              router.refresh();
            }
          });
        }}
      >
        <label className="block text-[10px] uppercase tracking-[0.12em] text-white/40">
          Store a new key in Vault
          <input
            name="apiKey"
            type="password"
            autoComplete="off"
            placeholder="Paste once. It will not be shown again."
            className="mt-2 h-11 w-full rounded-control border border-white/10 bg-white/[0.07] px-3 text-sm text-white outline-none placeholder:text-white/25"
          />
        </label>
        <div className="mt-3">
          <Button type="submit" size="sm" loading={busy}>Rotate key</Button>
        </div>
      </form>
    </div>
  );
}

function ConnectionIcon({ connected }: { connected: boolean }) {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M7.5 12.5 12.5 7.5M5.8 9.2 4.2 10.8a3 3 0 0 0 4.2 4.2l1.6-1.6M14.2 10.8l1.6-1.6A3 3 0 0 0 11.6 5L10 6.6" strokeLinecap="round" />
      {connected ? <path d="m7.6 10.2 1.5 1.5 3.4-3.5" strokeLinecap="round" strokeLinejoin="round" /> : null}
    </svg>
  );
}
