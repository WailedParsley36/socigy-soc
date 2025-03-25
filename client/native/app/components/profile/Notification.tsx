import React, { useEffect } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface NotificationProps {
  type: "success" | "error" | "info" | "warning";
  message: string;
  onClose: () => void;
  duration?: number;
}

export default function Notification({
  type,
  message,
  onClose,
  duration = 5000,
}: NotificationProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const getNotificationStyles = () => {
    switch (type) {
      case "success":
        return {
          bg: "bg-green-100 dark:bg-green-900/20",
          border: "border-l-4 border-green-500",
          text: "text-green-700 dark:text-green-300",
          icon: "checkmark-circle",
          iconColor: "#10B981",
        };
      case "error":
        return {
          bg: "bg-red-100 dark:bg-red-900/20",
          border: "border-l-4 border-red-500",
          text: "text-red-700 dark:text-red-300",
          icon: "close-circle",
          iconColor: "#EF4444",
        };
      default:
        return {
          bg: "bg-blue-100 dark:bg-blue-900/20",
          border: "border-l-4 border-blue-500",
          text: "text-blue-700 dark:text-blue-300",
          icon: "information-circle",
          iconColor: "#3B82F6",
        };
    }
  };

  const styles = getNotificationStyles();

  return (
    <View
      className={`absolute top-4 right-4 ${styles.bg} ${styles.border} p-4 rounded-lg shadow-md z-50 max-w-md`}
    >
      <View className="flex-row items-center">
        <Ionicons
          name={styles.icon as any}
          size={20}
          color={styles.iconColor}
        />
        <Text className={`ml-3 flex-1 ${styles.text} text-sm`}>{message}</Text>
        <TouchableOpacity onPress={onClose} className="ml-2">
          <Ionicons name="close" size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
