"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

type ToastType = "success" | "error" | "info";

type Toast = {
  id: string;
  type: ToastType;
  message: string;
};

type ToastContextValue = {
  toast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      toast: () => {},
      success: () => {},
      error: () => {},
    };
  }
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const toast = useCallback(
    (message: string, type?: ToastType) => addToast(message, type || "info"),
    [addToast]
  );
  const success = useCallback(
    (message: string) => addToast(message, "success"),
    [addToast]
  );
  const error = useCallback(
    (message: string) => addToast(message, "error"),
    [addToast]
  );

  return (
    <ToastContext.Provider value={{ toast, success, error }}>
      {children}
      <div
        className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} {...t} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ type, message }: { type: ToastType; message: string }) {
  const styles = {
    success: "bg-[#0d2818] border-[#60c860]/40 text-[#60c860]",
    error: "bg-[#2a1515] border-[#e07070]/40 text-[#e07070]",
    info: "bg-[#16161a] border-[#252529] text-[#c8c8d0]",
  };

  return (
    <div
      className={`px-4 py-3 rounded-xl border text-sm font-medium shadow-lg animate-fade-in ${styles[type]}`}
      role="alert"
    >
      {message}
    </div>
  );
}
