import { cn } from "@/lib/cn";

type Props = {
  className?: string;
  format?: "leaderboard" | "rectangle";
};

export function AdSlot({ className, format = "leaderboard" }: Props) {
  return (
    <aside
      aria-label="Ruang iklan"
      className={cn(
        "group relative flex overflow-hidden rounded-2xl border border-dashed border-[#ded9d6] bg-white/55 text-[#6f6763]",
        format === "leaderboard"
          ? "min-h-24 items-center justify-center px-6 py-5 sm:min-h-28"
          : "min-h-64 items-center justify-center p-6",
        className,
      )}
    >
      <div
        className="absolute inset-0 opacity-50 [background-image:radial-gradient(#ddd5d1_0.7px,transparent_0.7px)] [background-size:12px_12px]"
        aria-hidden
      />
      <div className="relative flex items-center gap-3 text-center">
        <span className="rounded-full border border-[#e5dfdc] bg-white px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.2em]">
          Advertisement
        </span>
        <p className="text-xs leading-5">
          Ads help keep every tool free to use.
        </p>
      </div>
    </aside>
  );
}
