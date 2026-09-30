import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Props = {
  children: ReactNode;
  className?: string;
};

export function Container({ children, className }: Props) {
  return <div className={cn("mx-auto w-full max-w-5xl px-5", className)}>{children}</div>;
}
