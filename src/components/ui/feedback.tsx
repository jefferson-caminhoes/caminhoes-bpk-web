import { cn } from "@/lib/utils";

type PanelProps = {
  message: string;
  className?: string;
};

export function LoadingPanel({ message, className }: PanelProps) {
  return (
    <div
      className={cn(
        "rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm",
        className,
      )}
    >
      <span className="inline-flex items-center gap-2">
        <span className="h-2 w-2 animate-pulse rounded-full bg-[#ee2331]" />
        {message}
      </span>
    </div>
  );
}

export function ErrorPanel({ message, className }: PanelProps) {
  return (
    <div
      className={cn(
        "rounded-md border border-red-200 bg-[#fff1f2] p-4 text-sm font-medium text-[#b5121f]",
        className,
      )}
    >
      {message}
    </div>
  );
}
