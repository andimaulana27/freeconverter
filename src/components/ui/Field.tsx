import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: ReactNode;
  hint?: ReactNode;
};

export function Field({ label, hint, className, ...props }: Props) {
  return (
    <label className="flex items-center gap-2 text-sm text-mute">
      {label}
      <input
        className={cn(
          "h-8 rounded-control border border-line bg-bone px-2.5 text-sm text-ink outline-none transition duration-180 focus:border-accent focus:shadow-glow",
          className,
        )}
        {...props}
      />
      {hint}
    </label>
  );
}
