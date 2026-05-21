import { cn } from "@/lib/utils";

type PanelProps = {
  message: string;
  className?: string;
};

export function LoadingPanel({ message, className }: PanelProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600",
        className,
      )}
    >
      {message}
    </div>
  );
}

export function ErrorPanel({ message, className }: PanelProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700",
        className,
      )}
    >
      {message}
    </div>
  );
}
