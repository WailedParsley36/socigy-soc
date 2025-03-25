import React from "react";
import { View, Text } from "react-native";
import { PublishStatus, VerificationStatus } from "@/lib/api/PluginAPI";

interface PluginBadgeProps {
  type: "verification" | "publish" | "custom";
  status?: VerificationStatus | PublishStatus;
  text?: string;
  color?: string;
}

export default function PluginBadge({
  type,
  status,
  text,
  color,
}: PluginBadgeProps) {
  let badgeText = text || "";
  let badgeColor =
    color || "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";

  if (type === "verification" && status !== undefined) {
    switch (status) {
      case VerificationStatus.Verified:
        badgeText = "Verified";
        badgeColor =
          "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
        break;
      case VerificationStatus.Pending:
        badgeText = "Pending Verification";
        badgeColor =
          "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
        break;
      case VerificationStatus.Unverified:
        badgeText = "Unverified";
        badgeColor =
          "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
        break;
      case VerificationStatus.Malicious:
        badgeText = "Malicious";
        badgeColor =
          "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
        break;
    }
  } else if (type === "publish" && status !== undefined) {
    switch (status) {
      case PublishStatus.Published:
        badgeText = "Published";
        badgeColor =
          "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
        break;
      case PublishStatus.Reviewing:
        badgeText = "Under Review";
        badgeColor =
          "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
        break;
      case PublishStatus.Preparing:
        badgeText = "Draft";
        badgeColor =
          "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
        break;
      case PublishStatus.TakenDown:
        badgeText = "Taken Down";
        badgeColor =
          "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
        break;
    }
  }

  return (
    <View className={`px-2.5 py-0.5 rounded-full ${badgeColor}`}>
      <Text className="text-xs font-medium">{badgeText}</Text>
    </View>
  );
}
