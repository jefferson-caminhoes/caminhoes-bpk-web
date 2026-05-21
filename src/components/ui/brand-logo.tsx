import Image from "next/image";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeClasses = {
  sm: {
    badge: "h-[88px] w-[88px]",
  },
  md: {
    badge: "h-[120px] w-[120px]",
  },
  lg: {
    badge: "h-[144px] w-[144px]",
  },
} as const;

export function BrandLogo({ size = "md", className }: BrandLogoProps) {
  const styles = sizeClasses[size];

  return (
    <div className={cn("flex items-center justify-center gap-3", className)}>
      <div
        className={cn(
          "relative shrink-0 flex items-center justify-center p-0",
          styles.badge,
        )}
        aria-hidden="true"
      >
        <Image
          src="/logo-sistema.png"
          alt=""
          fill
          sizes="120px"
          className="object-contain"
          priority
        />
      </div>
    </div>
  );
}
