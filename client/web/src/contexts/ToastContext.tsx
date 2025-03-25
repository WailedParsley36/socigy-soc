"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, "id">) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      hideToast(id);
    }, 5000);
  };

  const hideToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toasts, showToast, hideToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

function ToastContainer() {
  const { toasts, hideToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`p-4 rounded-lg shadow-lg flex items-start max-w-sm transform transition-all duration-300 ease-in-out ${
            toast.type === "success"
              ? "bg-green-50 border-l-4 border-green-500 text-green-800"
              : toast.type === "error"
              ? "bg-red-50 border-l-4 border-red-500 text-red-800"
              : toast.type === "warning"
              ? "bg-yellow-50 border-l-4 border-yellow-500 text-yellow-800"
              : "bg-blue-50 border-l-4 border-blue-500 text-blue-800"
          }`}
        >
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <h3 className="font-medium">{toast.title}</h3>
              <button
                onClick={() => hideToast(toast.id)}
                className="ml-4 text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            {toast.description && (
              <p className="mt-1 text-sm">{toast.description}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
