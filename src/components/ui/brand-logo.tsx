import { cn } from "@/lib/utils";

type BrandLogoProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeClasses = {
  sm: {
    badge: "h-9 w-9 text-[0.65rem]",
    title: "text-base",
    subtitle: "text-[0.65rem]",
  },
  md: {
    badge: "h-11 w-11 text-xs",
    title: "text-lg",
    subtitle: "text-xs",
  },
  lg: {
    badge: "h-14 w-14 text-sm",
    title: "text-xl",
    subtitle: "text-sm",
  },
} as const;

export function BrandLogo({ size = "md", className }: BrandLogoProps) {
  const styles = sizeClasses[size];

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-2xl bg-brand-navy font-bold tracking-[0.24em] text-white shadow-sm",
          styles.badge,
        )}
        aria-hidden="true"
      >
        BPK
      </div>
      <div className="min-w-0">
        <span
          className={cn(
            "block font-semibold leading-none text-brand-navy",
            styles.title,
          )}
        >
          Caminhoes BPK
        </span>
        <span
          className={cn(
            "mt-1 block truncate font-semibold uppercase tracking-[0.18em] text-brand-red",
            styles.subtitle,
          )}
        >
          Monitoramento operacional
        </span>
      </div>
    </div>
  );
}
