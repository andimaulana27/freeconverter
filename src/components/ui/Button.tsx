import { type ButtonHTMLAttributes, type ReactNode, forwardRef } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

export const buttonVariants = {
  primary:
    "bg-accent text-white shadow-sm hover:bg-accent-ink focus-visible:ring-accent",
  secondary:
    "border border-line bg-paper text-ink hover:border-accent hover:bg-accent-soft focus-visible:ring-accent",
  ghost: "text-mute hover:bg-paper hover:text-ink focus-visible:ring-line",
} as const;

export const buttonSizes = {
  sm: "h-8 gap-1.5 px-3 text-xs rounded-control",
  md: "h-10 gap-2 px-4 text-sm rounded-control",
} as const;

export type ButtonVariant = keyof typeof buttonVariants;
export type ButtonSize = keyof typeof buttonSizes;

const BASE =
  "inline-flex items-center justify-center font-medium outline-none transition duration-180 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-bone disabled:pointer-events-none disabled:opacity-50";

export function buttonClass({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cn(BASE, buttonVariants[variant], buttonSizes[size], className);
}

function Spinner() {
  return (
    <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" />
      <path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", loading, disabled, children, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={buttonClass({ variant, size, className })}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Spinner /> : null}
      {children}
    </button>
  );
});

type ButtonLinkProps = {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
};

export function ButtonLink({ href, children, variant = "ghost", size = "sm", className }: ButtonLinkProps) {
  return (
    <Link href={href} className={buttonClass({ variant, size, className })}>
      {children}
    </Link>
  );
}
