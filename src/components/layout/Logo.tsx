import Image from "next/image";
import { cn } from "@/lib/cn";

type LogoProps = {
  className?: string;
  variant?: "dark" | "light";
  priority?: boolean;
};

export function Logo({ className, variant = "dark", priority = false }: LogoProps) {
  return (
    <Image
      src={variant === "light" ? "/logo-light.png" : "/logo.png"}
      alt="AllYouConvert — Free converter for everyone"
      width={1200}
      height={311}
      priority={priority}
      className={cn("h-8 w-auto max-w-[152px] object-contain object-left sm:h-9 sm:max-w-[168px]", className)}
      style={{ width: "auto" }}
    />
  );
}
