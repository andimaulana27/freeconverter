import {
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type ComponentProps,
  type ReactNode,
  forwardRef,
} from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * Shared button scheme:
 * primary = principal product action, secondary = standard outline,
 * ink = strong neutral action, ghost = low-emphasis action,
 * danger = destructive action, support = donation/community action.
 */
export const buttonVariants = {
  primary:
    "bg-accent text-white shadow-action hover:-translate-y-0.5 hover:bg-accent-ink focus-visible:ring-accent",
  secondary:
    "border border-line bg-paper text-ink shadow-drop hover:-translate-y-0.5 hover:border-[#c9c1bc] hover:bg-bone focus-visible:ring-ink",
  ink: "bg-ink text-white shadow-tile hover:-translate-y-0.5 hover:bg-[#292321] focus-visible:ring-ink",
  ghost: "text-mute hover:bg-paper hover:text-ink focus-visible:ring-line",
  danger:
    "border border-danger/20 bg-white text-danger hover:-translate-y-0.5 hover:border-danger hover:bg-[#fff4f4] focus-visible:ring-danger",
  support:
    "overflow-hidden border border-[#d8d1cd] bg-paper text-ink shadow-drop before:absolute before:inset-0 before:z-0 before:origin-left before:scale-x-0 before:bg-ink before:transition-transform before:duration-280 hover:-translate-y-0.5 hover:border-ink hover:text-white hover:shadow-tile hover:before:scale-x-100 focus-visible:ring-ink focus-visible:before:scale-x-100 [&>*]:relative [&>*]:z-10",
} as const;

export const buttonSizes = {
  xs: "h-7 gap-1.5 rounded-control px-2.5 text-micro",
  sm: "h-8 gap-1.5 px-3 text-xs rounded-control",
  md: "h-10 gap-2 px-4 text-sm rounded-control",
  lg: "h-12 gap-2.5 rounded-control px-5 text-sm",
  icon: "h-10 w-10 rounded-control p-0",
} as const;

export type ButtonVariant = keyof typeof buttonVariants;
export type ButtonSize = keyof typeof buttonSizes;

const BASE =
  "group relative isolate inline-flex shrink-0 items-center justify-center font-medium outline-none transition duration-180 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:pointer-events-none disabled:opacity-50";

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

type ButtonLinkProps = Omit<ComponentProps<typeof Link>, "className"> & {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
};

export function ButtonLink({ children, variant = "ghost", size = "sm", className, ...props }: ButtonLinkProps) {
  return (
    <Link className={buttonClass({ variant, size, className })} {...props}>
      {children}
    </Link>
  );
}

type ButtonAnchorProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function ButtonAnchor({
  children,
  variant = "secondary",
  size = "md",
  className,
  ...props
}: ButtonAnchorProps) {
  return (
    <a className={buttonClass({ variant, size, className })} {...props}>
      {children}
    </a>
  );
}
