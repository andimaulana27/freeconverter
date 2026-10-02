import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";

export function shotStyle(hot?: boolean): CSSProperties {
  return { animationDuration: hot ? "1.15s" : "2.2s" };
}

export function ShotKick({
  hot,
  className,
  children,
}: {
  hot?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("motion-safe:animate-kick", className)} style={shotStyle(hot)}>
      {children}
    </div>
  );
}

export function ShotHit({
  hot,
  className,
  children,
}: {
  hot?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("motion-safe:animate-impact", className)} style={shotStyle(hot)}>
      {children}
    </div>
  );
}

export function ShotLane({
  hot,
  tone = "accent",
  className,
}: {
  hot?: boolean;
  tone?: "accent" | "light";
  className?: string;
}) {
  const style = shotStyle(hot);
  const light = tone === "light";

  return (
    <div className={cn("relative mx-1 h-10 min-w-[3.25rem] flex-1 sm:mx-2", className)} aria-hidden>
      <span
        className={cn(
          "absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-[length:7px_1px]",
          light
            ? "bg-[linear-gradient(to_right,rgba(255,106,100,0.55)_46%,transparent_0)]"
            : "bg-[linear-gradient(to_right,rgba(217,45,40,0.3)_46%,transparent_0)]",
        )}
      />
      <span
        className={cn(
          "absolute right-0 top-1/2 h-[7px] w-[7px] -translate-y-1/2 rotate-45 border-r-[1.5px] border-t-[1.5px]",
          light ? "border-accent-light/80" : "border-accent/55",
        )}
      />
      <span
        className={cn(
          "pointer-events-none absolute right-0 top-1/2 size-9 rounded-full border-2 motion-safe:animate-impactGlow",
          light ? "border-accent-light" : "border-accent",
        )}
        style={style}
      />
      <span
        className={cn(
          "absolute left-0 top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full motion-safe:animate-muzzle",
          light ? "bg-accent-light shadow-[0_0_0_3px_rgba(255,106,100,0.2)]" : "bg-accent/80 shadow-[0_0_0_3px_rgba(217,45,40,0.12)]",
        )}
        style={style}
      />
      <span className="absolute top-1/2 motion-safe:animate-shot" style={style}>
        <span
          className={cn(
            "absolute right-[7px] top-1/2 h-[3px] w-9 -translate-y-1/2 rounded-full bg-gradient-to-l to-transparent",
            light ? "from-accent-light via-accent-light/70" : "from-accent via-accent/70",
          )}
        />
        <span
          className={cn(
            "relative block size-2.5 rounded-full shadow-[0_0_14px_rgba(217,45,40,0.8)] ring-2",
            light ? "bg-accent-light ring-[#181412]" : "bg-accent ring-white",
          )}
        />
      </span>
    </div>
  );
}
