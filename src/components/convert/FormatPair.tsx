import { cn } from "@/lib/cn";
import { ShotHit, ShotKick, ShotLane } from "@/components/convert/ShotRoute";

type Props = {
  from: string;
  to: string;
  className?: string;
};

export function FormatPair({ from, to, className }: Props) {
  return (
    <p className={cn("flex items-center gap-3 font-mono tracking-tight text-ink", className)}>
      <ShotKick>
        <span className="text-4xl sm:text-6xl">{from.toUpperCase()}</span>
      </ShotKick>
      <ShotLane className="mx-0 h-8 w-16 flex-none sm:w-24" />
      <ShotHit>
        <span className="text-4xl text-accent sm:text-6xl">{to.toUpperCase()}</span>
      </ShotHit>
    </p>
  );
}
