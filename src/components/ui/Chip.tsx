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
        "inline-flex items-center rounded-full border border-line bg-paper px-3 py-1.5 text-sm text-ink shadow-sm transition duration-180 hover:-translate-y-px hover:border-accent hover:shadow-drop",
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
