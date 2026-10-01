import { cn } from "@/lib/cn";

type Props = {
  from: string;
  to: string;
  className?: string;
};

export function FormatPair({ from, to, className }: Props) {
  return (
    <p className={cn("flex items-baseline gap-3 font-mono tracking-tight text-ink", className)}>
      <span className="text-4xl sm:text-6xl">{from.toUpperCase()}</span>
      <span className="animate-arrow text-2xl text-accent sm:text-4xl" aria-hidden>
        →
      </span>
      <span className="text-4xl text-accent sm:text-6xl">{to.toUpperCase()}</span>
    </p>
  );
}
