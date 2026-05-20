"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

// Types
export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ConfirmState {
  isOpen: boolean;
  title: string;
  message: string;
  resolve: (value: boolean) => void;
}

interface NotificationContextProps {
  toast: {
    success: (message: string, duration?: number) => void;
    error: (message: string, duration?: number) => void;
    warning: (message: string, duration?: number) => void;
    info: (message: string, duration?: number) => void;
  };
  confirm: (message: string, title?: string) => Promise<boolean>;
}

// Contexts
const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

export function useToast() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useToast must be used within a NotificationProvider");
  }
  return context.toast;
}

export function useConfirm() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useConfirm must be used within a NotificationProvider");
  }
  return context.confirm;
}

// Toast Component
interface ToastProps {
  toast: ToastItem;
  onClose: (id: string) => void;
}

function Toast({ toast, onClose }: ToastProps) {
  const { id, message, type, duration = 4000 } = toast;
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);

    const intervalTime = 20;
    const steps = duration / intervalTime;
    const stepValue = 100 / steps;

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(progressInterval);
          return 0;
        }
        return prev - stepValue;
      });
    }, intervalTime);

    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, [id, duration, onClose]);

  // Style mappings
  const config = {
    success: {
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
      border: "border-emerald-500/30 shadow-emerald-500/5",
      bg: "bg-emerald-500/10",
      progressBg: "bg-emerald-500",
    },
    error: {
      icon: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />,
      border: "border-rose-500/30 shadow-rose-500/5",
      bg: "bg-rose-500/10",
      progressBg: "bg-rose-500",
    },
    warning: {
      icon: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
      border: "border-amber-500/30 shadow-amber-500/5",
      bg: "bg-amber-500/10",
      progressBg: "bg-amber-500",
    },
    info: {
      icon: <Info className="w-5 h-5 text-blue-500 shrink-0" />,
      border: "border-blue-500/30 shadow-blue-500/5",
      bg: "bg-blue-500/10",
      progressBg: "bg-blue-500",
    },
  }[type];

  return (
    <div
      className={`auth-card p-4 flex items-start gap-3 w-80 max-w-sm border backdrop-blur-xl bg-slate-950/85 relative overflow-hidden transition-all duration-300 pointer-events-auto hover:translate-y-[-2px] hover:shadow-lg shadow-2xl ${config.border} animate-[slideIn_0.3s_cubic-bezier(0.34,1.56,0.64,1)]`}
    >
      <div className="flex-1 flex gap-3 min-w-0">
        <div className="mt-0.5">{config.icon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-white/95 leading-relaxed break-words pr-2">
            {message}
          </p>
        </div>
      </div>
      <button
        onClick={() => onClose(id)}
        className="text-white/40 hover:text-white/90 p-0.5 rounded-lg transition-colors cursor-pointer shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5">
        <div
          className={`h-full transition-all duration-75 ease-linear ${config.progressBg}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

// Global Notification Provider
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState>({
    isOpen: false,
    title: "Confirmar Ação",
    message: "",
    resolve: () => {},
  });

  const addToast = useCallback((message: string, type: ToastType, duration?: number) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = React.useMemo(
    () => ({
      success: (message: string, duration?: number) => addToast(message, "success", duration),
      error: (message: string, duration?: number) => addToast(message, "error", duration),
      warning: (message: string, duration?: number) => addToast(message, "warning", duration),
      info: (message: string, duration?: number) => addToast(message, "info", duration),
    }),
    [addToast]
  );

  const confirm = useCallback((message: string, title: string = "Confirmar Interação") => {
    return new Promise<boolean>((resolve) => {
      setConfirmState({
        isOpen: true,
        title,
        message,
        resolve: (value) => {
          setConfirmState((prev) => ({ ...prev, isOpen: false }));
          // Give transition time before resolving
          setTimeout(() => resolve(value), 100);
        },
      });
    });
  }, []);

  return (
    <NotificationContext.Provider value={{ toast, confirm }}>
      {children}

      {/* Toasts Container */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none max-w-full">
        {toasts.map((t) => (
          <Toast key={t.id} toast={t} onClose={removeToast} />
        ))}
      </div>

      {/* Custom Confirmation Modal */}
      {confirmState.isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-[fadeIn_0.2s_ease-out] select-none">
          <div className="auth-card max-w-md w-full p-6 border border-[#ffd700]/25 bg-gradient-to-b from-[#0d2b1a] to-[#0a0f1e] relative overflow-hidden rounded-3xl shadow-2xl animate-[cardEntrance_0.3s_cubic-bezier(0.34,1.56,0.64,1)]">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <CheckCircle2 className="w-24 h-24 text-[#ffd700]" />
            </div>

            <h3 className="text-lg font-black text-[#ffd700] mb-2 tracking-wide flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-[#ffd700] shrink-0" />
              {confirmState.title}
            </h3>

            <p className="text-sm text-white/80 mt-3 mb-6 leading-relaxed font-medium">
              {confirmState.message}
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => confirmState.resolve(false)}
                className="copa-btn-ghost px-5 py-2.5 text-xs font-bold transition-all cursor-pointer rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => confirmState.resolve(true)}
                className="copa-btn-primary px-6 py-2.5 text-xs font-black tracking-wider uppercase transition-all shadow-lg shadow-[#ffd700]/15 rounded-xl cursor-pointer"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global CSS for custom animations if needed */}
      <style jsx global>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(100%) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </NotificationContext.Provider>
  );
}
