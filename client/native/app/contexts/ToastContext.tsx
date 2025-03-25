import React, { createContext, useContext, useState, ReactNode } from "react";
import { View, Text, Pressable } from "react-native";
import { AntDesign } from "@expo/vector-icons";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (toast: any) => void;
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
    <View className="absolute bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <View
          key={toast.id}
          className={`p-4 rounded-lg shadow-lg flex-row items-start max-w-sm ${
            toast.type === "success"
              ? "bg-green-50 border-l-4 border-green-500"
              : toast.type === "error"
              ? "bg-red-50 border-l-4 border-red-500"
              : toast.type === "warning"
              ? "bg-yellow-50 border-l-4 border-yellow-500"
              : "bg-blue-50 border-l-4 border-blue-500"
          }`}
        >
          <View className="flex-1">
            <View className="flex-row justify-between items-start">
              <Text
                className={`font-medium ${
                  toast.type === "success"
                    ? "text-green-800"
                    : toast.type === "error"
                    ? "text-red-800"
                    : toast.type === "warning"
                    ? "text-yellow-800"
                    : "text-blue-800"
                }`}
              >
                {toast.title}
              </Text>
              <Pressable onPress={() => hideToast(toast.id)} className="ml-4">
                <AntDesign name="close" size={16} color="#9CA3AF" />
              </Pressable>
            </View>
            {toast.description && (
              <Text
                className={`mt-1 text-sm ${
                  toast.type === "success"
                    ? "text-green-600"
                    : toast.type === "error"
                    ? "text-red-600"
                    : toast.type === "warning"
                    ? "text-yellow-600"
                    : "text-blue-600"
                }`}
              >
                {toast.description}
              </Text>
            )}
          </View>
        </View>
      ))}
    </View>
  );
}
