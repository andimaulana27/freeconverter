import { cn } from "@/lib/cn";

type Props = {
  className?: string;
  format?: "leaderboard" | "rectangle";
};

export function AdSlot({ className, format = "leaderboard" }: Props) {
  return (
    <aside
      aria-label="Advertisement"
      className={cn(
        "group relative flex overflow-hidden rounded-tile border border-[#ded7d3] bg-[#f6f3f1] text-faint shadow-drop",
        format === "leaderboard"
          ? "min-h-24 items-center justify-center px-6 py-5 sm:min-h-28"
          : "min-h-64 items-center justify-center p-6",
        className,
      )}
    >
      <div
        className="absolute inset-0 opacity-45 [background-image:linear-gradient(rgba(24,20,18,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(24,20,18,0.035)_1px,transparent_1px)] [background-size:32px_32px]"
        aria-hidden
      />
      <div className="relative flex flex-col items-center gap-2 text-center sm:flex-row sm:gap-3">
        <span className="rounded-full border border-[#ded7d3] bg-white px-3 py-1 text-micro font-bold uppercase text-faint">
          Advertisement
        </span>
        <p className="text-xs leading-5 text-mute">
          A small reserved space that helps keep every tool free.
        </p>
      </div>
    </aside>
  );
}
