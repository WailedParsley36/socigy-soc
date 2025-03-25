import React from "react";
import { View, Text, TouchableOpacity, FlatList } from "react-native";
import { format } from "date-fns";
import { Ionicons } from "@expo/vector-icons";
import {
  LoginAttempt,
  SecurityLog,
  SecurityEventType,
} from "@/lib/api/ProfileHelper";

interface SecurityPanelProps {
  loginAttempts: LoginAttempt[];
  securityLogs: SecurityLog[];
  onLoadMoreLoginAttempts: () => void;
  onLoadMoreSecurityLogs: () => void;
  isLoading: boolean;
}

export default function SecurityPanel({
  loginAttempts,
  securityLogs,
  onLoadMoreLoginAttempts,
  onLoadMoreSecurityLogs,
  isLoading,
}: SecurityPanelProps) {
  const getSecurityEventTypeName = (type: SecurityEventType) => {
    switch (type) {
      case SecurityEventType.LOGIN_SUCCESS:
        return "Login Success";
      case SecurityEventType.LOGIN_FAILURE:
        return "Login Failure";
      case SecurityEventType.PASSWORD_CHANGE:
        return "Password Change";
      case SecurityEventType.EMAIL_CHANGE:
        return "Email Change";
      case SecurityEventType.MFA_ENABLED:
        return "MFA Enabled";
      case SecurityEventType.MFA_DISABLED:
        return "MFA Disabled";
      case SecurityEventType.DEVICE_TRUSTED:
        return "Device Trusted";
      case SecurityEventType.DEVICE_BLOCKED:
        return "Device Blocked";
      case SecurityEventType.MFA_REMOVED:
        return "MFA Removed";
      default:
        return "Unknown";
    }
  };

  const getSecurityEventIcon = (type: SecurityEventType) => {
    let iconName: string;
    let iconColor: string;
    let bgColor: string;

    switch (type) {
      case SecurityEventType.LOGIN_SUCCESS:
        iconName = "checkmark-circle";
        iconColor = "#10B981";
        bgColor = "bg-green-100 dark:bg-green-900/30";
        break;
      case SecurityEventType.LOGIN_FAILURE:
        iconName = "close-circle";
        iconColor = "#EF4444";
        bgColor = "bg-red-100 dark:bg-red-900/30";
        break;
      case SecurityEventType.PASSWORD_CHANGE:
      case SecurityEventType.EMAIL_CHANGE:
        iconName = "create";
        iconColor = "#3B82F6";
        bgColor = "bg-blue-100 dark:bg-blue-900/30";
        break;
      case SecurityEventType.MFA_ENABLED:
      case SecurityEventType.MFA_DISABLED:
      case SecurityEventType.MFA_REMOVED:
        iconName = "shield-checkmark";
        iconColor = "#8B5CF6";
        bgColor = "bg-purple-100 dark:bg-purple-900/30";
        break;
      case SecurityEventType.DEVICE_TRUSTED:
      case SecurityEventType.DEVICE_BLOCKED:
        iconName = "hardware-chip";
        iconColor = "#F59E0B";
        bgColor = "bg-yellow-100 dark:bg-yellow-900/30";
        break;
      default:
        iconName = "help-circle";
        iconColor = "#6B7280";
        bgColor = "bg-gray-100 dark:bg-gray-700";
    }

    return (
      <View className={`p-2 ${bgColor} rounded-full`}>
        <Ionicons name={iconName as any} size={20} color={iconColor} />
      </View>
    );
  };

  const renderLoginAttempt = ({ item: attempt }: any) => (
    <View className="flex-row items-start border-b dark:border-gray-700 pb-4 mb-4">
      <View className="mr-4">
        {attempt.success
          ? getSecurityEventIcon(SecurityEventType.LOGIN_SUCCESS)
          : getSecurityEventIcon(SecurityEventType.LOGIN_FAILURE)}
      </View>
      <View className="flex-grow">
        <Text className="font-medium text-gray-900 dark:text-white">
          {attempt.success ? "Successful Login" : "Failed Login Attempt"}
        </Text>
        <View className="mt-1">
          <Text className="text-sm text-gray-600 dark:text-gray-300">
            IP Address: {attempt.ipAddress}
          </Text>
          <Text className="text-sm text-gray-600 dark:text-gray-300">
            Device:{" "}
            {attempt.deviceId
              ? `Device #${attempt.deviceId}`
              : "Unknown Device"}
          </Text>
          <Text className="text-sm text-gray-600 dark:text-gray-300">
            Browser:{" "}
            {attempt.userAgent ? attempt.userAgent.split(" ")[0] : "Unknown"}
          </Text>
        </View>
      </View>
      <Text className="text-right text-xs text-gray-500 dark:text-gray-400">
        {attempt.attemptAt
          ? format(new Date(attempt.attemptAt), "MMM d, yyyy h:mm a")
          : "Unknown date"}
      </Text>
    </View>
  );

  const renderSecurityLog = ({ item: log }: any) => (
    <View className="flex-row items-start border-b dark:border-gray-700 pb-4 mb-4">
      <View className="mr-4">{getSecurityEventIcon(log.eventType)}</View>
      <View className="flex-grow">
        <Text className="font-medium text-gray-900 dark:text-white">
          {getSecurityEventTypeName(log.eventType)}
        </Text>
        <Text className="text-sm text-gray-600 dark:text-gray-300 mt-1">
          {log.details}
        </Text>
        <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          IP Address: {log.ipAddress}
        </Text>
      </View>
      <Text className="text-right text-xs text-gray-500 dark:text-gray-400">
        {format(new Date(log.eventAt), "MMM d, yyyy h:mm a")}
      </Text>
    </View>
  );

  return (
    <View className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6">
      <Text className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
        Security Activity
      </Text>
      <Text className="text-gray-600 dark:text-gray-300 mb-4">
        Recent security events and login attempts for your account.
      </Text>

      <View className="mb-6">
        <Text className="text-lg font-medium mb-3 text-gray-900 dark:text-white">
          Login History
        </Text>
        <FlatList
          data={loginAttempts}
          renderItem={renderLoginAttempt}
          keyExtractor={(item, index) => index.toString()}
          ListFooterComponent={
            loginAttempts.length > 0 ? (
              <TouchableOpacity
                onPress={onLoadMoreLoginAttempts}
                className="mt-4"
              >
                <Text className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                  Load More
                </Text>
              </TouchableOpacity>
            ) : null
          }
        />
      </View>

      <View>
        <Text className="text-lg font-medium mb-3 text-gray-900 dark:text-white">
          Security Events
        </Text>
        <FlatList
          data={securityLogs}
          renderItem={renderSecurityLog}
          keyExtractor={(item) => item.id.toString()}
          ListFooterComponent={
            securityLogs.length > 0 ? (
              <TouchableOpacity
                onPress={onLoadMoreSecurityLogs}
                className="mt-4"
              >
                <Text className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                  Load More
                </Text>
              </TouchableOpacity>
            ) : null
          }
        />
      </View>
    </View>
  );
}
