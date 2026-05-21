import Image from "next/image";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeClasses = {
  sm: {
    badge: "h-[72px] w-[72px]",
  },
  md: {
    badge: "h-[84px] w-[84px]",
  },
  lg: {
    badge: "h-[96px] w-[96px]",
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
          sizes="96px"
          className="object-contain p-1"
          priority
        />
      </div>
    </div>
  );
}
