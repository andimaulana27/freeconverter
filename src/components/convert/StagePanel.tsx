import type { ReactNode } from "react";

type Props = {
  label: string;
  hint?: string;
  children: ReactNode;
};

export function StagePanel({ label, hint, children }: Props) {
  return (
    <div className="mt-5 overflow-hidden rounded-card border border-[#e5dfdc] bg-[#faf8f7] p-4 sm:p-5">
      <div className="mb-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-accent">{label}</p>
        {hint ? <p className="mt-1 text-[11px] leading-5 text-mute">{hint}</p> : null}
      </div>
      {children}
    </div>
  );
}
