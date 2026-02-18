"use client";
import { createContext, useContext, useState, ReactNode } from "react";

interface Toast {
  id: number;
  title: string;
  description?: string;
  variant?: "default" | "destructive";
}

interface ToastContextType {
  toast: (t: Omit<Toast, "id">) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  function toast(t: Omit<Toast, "id">) {
    setToasts((prev) => [
      ...prev,
      { ...t, id: Date.now() + Math.random() },
    ]);
    setTimeout(() => {
      setToasts((prev) => prev.slice(1));
    }, 4000);
  }
  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(({ id, title, description, variant }) => (
          <div
            key={id}
            className={`rounded shadow-lg px-4 py-3 min-w-[220px] max-w-xs text-sm font-medium transition-all
              ${variant === "destructive" ? "bg-red-600 text-white" : "bg-zinc-800 text-white"}`}
          >
            <div>{title}</div>
            {description && <div className="text-xs mt-1 opacity-80">{description}</div>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
