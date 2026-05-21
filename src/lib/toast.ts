export type ToastKind = "success" | "error" | "info";

export type Toast = {
  id: string;
  message: string;
  kind: ToastKind;
};

type ToastListener = (toast: Toast) => void;

const listeners = new Set<ToastListener>();

function generateId() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function subscribeToast(listener: ToastListener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function pushToast(message: string, kind: ToastKind = "info") {
  const toast: Toast = { id: generateId(), message, kind };
  listeners.forEach((listener) => listener(toast));
  return toast.id;
}
