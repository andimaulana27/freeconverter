import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/Badge";

type Props = {
  href: string;
  children: ReactNode;
  soon?: boolean;
  className?: string;
};

export function Chip({ href, children, soon, className }: Props) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center border-b border-transparent py-1 text-sm text-mute transition duration-180 hover:border-accent hover:text-ink",
        soon && "text-mute",
        className,
      )}
    >
      {children}
      {soon ? (
        <Badge tone="warn" className="ml-1.5">
          soon
        </Badge>
      ) : null}
    </Link>
  );
}
