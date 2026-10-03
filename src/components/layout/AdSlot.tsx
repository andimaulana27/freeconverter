"use client";

import { useEffect, useRef, useState } from "react";
import { useAdConfig } from "@/components/layout/AdConfigProvider";
import { cn } from "@/lib/cn";
import { defaultResolvedPlacement, formatFromSize, type PlacementKey, type ResolvedCreative, type ResolvedPlacement } from "@/lib/ads/types";

type Props = {
  placement: PlacementKey;
  className?: string;
};

function GoogleUnit({
  spec,
}: {
  spec: { width: number; height: number; clientId: string; slot: string };
}) {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    try {
      const adsWindow = window as typeof window & { adsbygoogle?: Record<string, never>[] };
      (adsWindow.adsbygoogle ??= []).push({});
    } catch {
      initialized.current = false;
    }
  }, [spec.slot, spec.clientId]);

  return (
    <ins
      className="adsbygoogle"
      style={{ display: "inline-block", width: spec.width, height: spec.height }}
      data-ad-client={spec.clientId}
      data-ad-slot={spec.slot}
      data-full-width-responsive="false"
      data-adtest={process.env.NODE_ENV === "production" ? undefined : "on"}
    />
  );
}

function Placeholder({ width, height }: { width: number; height: number }) {
  return (
    <div
      className="grid place-items-center border border-dashed border-[#d6ceca] bg-white/80 text-center"
      style={{ width, height }}
    >
      <span>
        <span className="block font-mono text-micro font-bold uppercase text-mute">Fixed ad unit</span>
        <span className="mt-1 block text-[10px] text-mute">
          {width} × {height}
        </span>
      </span>
    </div>
  );
}

function CreativeUnit({
  creative,
  width,
  height,
  clientId,
}: {
  creative: ResolvedCreative | null;
  width: number;
  height: number;
  clientId: string | null;
}) {
  if (!creative || creative.type === "empty") {
    return <Placeholder width={width} height={height} />;
  }

  if (creative.type === "image" && creative.imageUrl && creative.targetUrl) {
    return (
      <a
        href={creative.targetUrl}
        rel="sponsored noopener noreferrer"
        target="_blank"
        className="block overflow-hidden"
        style={{ width, height }}
      >
        {/* Ad creatives must keep exact pixel size; do not optimize. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={creative.imageUrl}
          alt={creative.altText || "Advertisement"}
          width={width}
          height={height}
          className="h-full w-full object-contain"
        />
      </a>
    );
  }

  const adsenseClient = creative.googleClientId ?? clientId;
  const slot = creative.googleSlotId;
  if (creative.type === "adsense" && adsenseClient && slot) {
    return <GoogleUnit spec={{ width, height, clientId: adsenseClient, slot }} />;
  }

  return <Placeholder width={width} height={height} />;
}

function frameClass(placement: ResolvedPlacement, className?: string) {
  const format = formatFromSize(placement.desktopWidth, placement.desktopHeight);
  return cn(
    "group relative flex flex-col items-center justify-center gap-2 overflow-hidden border border-[#ded7d3] bg-[#f6f3f1] text-mute shadow-drop",
    format === "leaderboard"
      ? "left-1/2 min-h-[132px] w-screen max-w-full -translate-x-1/2 rounded-tile px-0 py-4 sm:left-auto sm:w-full sm:translate-x-0"
      : format === "rectangle"
        ? "min-h-[294px] rounded-tile p-4"
        : "h-[638px] w-[160px] rounded-card py-3",
    className,
  );
}

export function AdSlot({ placement, className }: Props) {
  const config = useAdConfig();
  const resolved = config.placements[placement] ?? defaultResolvedPlacement(placement);
  const usesSwap = resolved.mobilePolicy === "swap" && resolved.mobileWidth && resolved.mobileHeight;
  const [mobile, setMobile] = useState<boolean | null>(usesSwap ? null : false);

  useEffect(() => {
    if (!usesSwap) return;
    const media = window.matchMedia("(max-width: 767px)");
    const update = () => setMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [usesSwap]);

  if (!config.enabled) return null;
  if (!resolved.reserveSpace && !resolved.desktop && !resolved.mobile) return null;
  if (resolved.fallbackBehavior === "collapse" && !resolved.desktop && !resolved.mobile) return null;

  const useMobile = Boolean(usesSwap && mobile);
  const width = useMobile && resolved.mobileWidth ? resolved.mobileWidth : resolved.desktopWidth;
  const height = useMobile && resolved.mobileHeight ? resolved.mobileHeight : resolved.desktopHeight;
  const creative = useMobile ? resolved.mobile ?? resolved.desktop : resolved.desktop;
  const ready = !usesSwap || mobile !== null;

  return (
    <aside aria-label="Advertisement" className={frameClass(resolved, className)}>
      <div
        className="absolute inset-0 opacity-45 [background-image:linear-gradient(rgba(24,20,18,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(24,20,18,0.035)_1px,transparent_1px)] [background-size:32px_32px]"
        aria-hidden
      />
      <span className="relative font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-mute">Advertisement</span>
      <div className="relative flex w-full justify-center overflow-visible">
        {ready ? (
          <CreativeUnit
            key={`${creative?.id ?? "empty"}:${width}x${height}`}
            creative={creative}
            width={width}
            height={height}
            clientId={config.adsenseClientId}
          />
        ) : (
          <div className="h-[100px] w-[320px] sm:h-[90px] sm:w-[728px]" aria-hidden />
        )}
      </div>
    </aside>
  );
}
