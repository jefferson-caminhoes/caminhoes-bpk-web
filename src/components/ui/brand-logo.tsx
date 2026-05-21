import Image from "next/image";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeClasses = {
  sm: {
    badge: "h-14 w-14",
  },
  md: {
    badge: "h-16 w-16",
  },
  lg: {
    badge: "h-20 w-20",
  },
} as const;

export function BrandLogo({ size = "md", className }: BrandLogoProps) {
  const styles = sizeClasses[size];

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "relative shrink-0 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200",
          styles.badge,
        )}
        aria-hidden="true"
      >
        <Image
          src="/logo-sistema.png"
          alt=""
          fill
          sizes="72px"
          className="object-contain p-1"
          priority
        />
      </div>
    </div>
  );
}
