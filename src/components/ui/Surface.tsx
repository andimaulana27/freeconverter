import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Props = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function Surface({ children, className, ...props }: Props) {
  return (
    <div className={cn("rounded-card border border-line bg-paper shadow-drop", className)} {...props}>
      {children}
    </div>
  );
}
