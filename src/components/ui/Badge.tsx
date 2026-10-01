import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

const TONE = {
  mute: "bg-bone text-mute",
  accent: "bg-accent-soft text-accent",
  warn: "bg-bone text-warn",
  ok: "bg-bone text-ok",
} as const;

type Props = {
  children: ReactNode;
  tone?: keyof typeof TONE;
  className?: string;
};

export function Badge({ children, tone = "mute", className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide",
        TONE[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
