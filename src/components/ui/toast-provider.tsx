"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { subscribeToast, type Toast } from "@/lib/toast";

type ToastProviderProps = {
  children: React.ReactNode;
};

const TOAST_TIMEOUT = 4000;

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timeouts = useRef(new Map<string, number>());

  useEffect(() => {
    const unsubscribe = subscribeToast((toast) => {
      setToasts((prev) => [...prev, toast]);

      const timeoutId = window.setTimeout(() => {
        setToasts((prev) => prev.filter((item) => item.id !== toast.id));
        timeouts.current.delete(toast.id);
      }, TOAST_TIMEOUT);

      timeouts.current.set(toast.id, timeoutId);
    });

    return () => {
      unsubscribe();
      timeouts.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
      timeouts.current.clear();
    };
  }, []);

  const handleDismiss = (toastId: string) => {
    const timeoutId = timeouts.current.get(toastId);
    if (timeoutId) {
      window.clearTimeout(timeoutId);
      timeouts.current.delete(toastId);
    }
    setToasts((prev) => prev.filter((toast) => toast.id !== toastId));
  };

  return (
    <>
      {children}
      <div
        className="pointer-events-none fixed right-4 top-4 z-50 flex w-[min(360px,90vw)] flex-col gap-3"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "pointer-events-auto flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg",
              toast.kind === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : toast.kind === "error"
                  ? "border-red-200 bg-red-50 text-red-800"
                  : "border-zinc-200 bg-white text-zinc-700",
            )}
          >
            <span>{toast.message}</span>
            <button
              type="button"
              onClick={() => handleDismiss(toast.id)}
              className="rounded-full p-1 text-current hover:bg-black/10"
              aria-label="Fechar"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
