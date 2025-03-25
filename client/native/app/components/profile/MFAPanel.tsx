import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MFASettings, MFAType } from "@/lib/api/ProfileHelper";

interface MFAPanelProps {
  mfaSettings: MFASettings[];
  onEnableMFA: (type: MFAType) => void;
  onSetDefaultMFA: (type: MFAType) => void;
  onRemoveMFA: (type: MFAType) => void;
  isLoading: boolean;
}

export default function MFAPanel({
  mfaSettings,
  onEnableMFA,
  onSetDefaultMFA,
  onRemoveMFA,
  isLoading,
}: MFAPanelProps) {
  const getMFATypeName = (type: MFAType) => {
    switch (type) {
      case MFAType.Email:
        return "Email";
      case MFAType.Authenticator:
        return "Authenticator App";
      case MFAType.PhoneNumber:
        return "Phone Number";
      case MFAType.Application:
        return "Application";
      default:
        return "Unknown";
    }
  };

  if (isLoading) {
    return (
      <View className="bg-white dark:bg-gray-800 rounded-lg p-6">
        <View className="space-y-4">
          <View className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
          <View className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          <View className="space-y-2">
            {[1, 2, 3].map((i) => (
              <View
                key={i}
                className="h-24 bg-gray-200 dark:bg-gray-700 rounded"
              />
            ))}
          </View>
        </View>
      </View>
    );
  }

  return (
    <ScrollView className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6">
      <Text className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
        Multi-Factor Authentication
      </Text>
      <Text className="text-gray-600 dark:text-gray-300 mb-6">
        Secure your account with multiple authentication methods. We recommend
        enabling at least one MFA method for enhanced security.
      </Text>

      <View className="space-y-4">
        {/* Email MFA */}
        <View className="border dark:border-gray-700 rounded-lg p-4">
          <View className="flex-row justify-between items-start">
            <View className="flex-row items-start">
              <View className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full mr-3">
                <Ionicons name="mail" size={24} color="#2563EB" />
              </View>
              <View>
                <Text className="font-medium text-gray-900 dark:text-white">
                  Email Authentication
                </Text>
                <Text className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  Receive a verification code via email when logging in from a
                  new device.
                </Text>
                {mfaSettings.find((m) => m.type === MFAType.Email)
                  ?.isDefault && (
                  <View className="mt-2 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full self-start">
                    <Text className="text-green-800 dark:text-green-300 text-xs">
                      Default Method
                    </Text>
                  </View>
                )}
              </View>
            </View>
            <View>
              {mfaSettings.find((m) => m.type === MFAType.Email)?.isEnabled ? (
                <View className="flex-row space-x-2">
                  {!mfaSettings.find((m) => m.type === MFAType.Email)
                    ?.isDefault && (
                    <TouchableOpacity
                      onPress={() => onSetDefaultMFA(MFAType.Email)}
                      className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 rounded"
                    >
                      <Text className="text-blue-700 dark:text-blue-300">
                        Set Default
                      </Text>
                    </TouchableOpacity>
                  )}
                  {!mfaSettings.find((m) => m.type === MFAType.Email)
                    ?.isDefault && (
                    <TouchableOpacity
                      onPress={() => onRemoveMFA(MFAType.Email)}
                      className="px-3 py-1 bg-red-100 dark:bg-red-900/30 rounded"
                    >
                      <Text className="text-red-700 dark:text-red-300">
                        Remove
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => onEnableMFA(MFAType.Email)}
                  className="px-3 py-1 bg-green-100 dark:bg-green-900/30 rounded"
                >
                  <Text className="text-green-700 dark:text-green-300">
                    Enable
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Authenticator App MFA */}
        <View className="border dark:border-gray-700 rounded-lg p-4">
          <View className="flex-row justify-between items-start">
            <View className="flex-row items-start">
              <View className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full mr-3">
                <Ionicons name="phone-portrait" size={24} color="#7C3AED" />
              </View>
              <View>
                <Text className="font-medium text-gray-900 dark:text-white">
                  Authenticator App
                </Text>
                <Text className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  Use an authenticator app like Google Authenticator or Authy to
                  generate verification codes.
                </Text>
                {mfaSettings.find((m) => m.type === MFAType.Authenticator)
                  ?.isDefault && (
                  <View className="mt-2 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full self-start">
                    <Text className="text-green-800 dark:text-green-300 text-xs">
                      Default Method
                    </Text>
                  </View>
                )}
              </View>
            </View>
            <View>
              {mfaSettings.find((m) => m.type === MFAType.Authenticator)
                ?.isEnabled ? (
                <View className="flex-row space-x-2">
                  {!mfaSettings.find((m) => m.type === MFAType.Authenticator)
                    ?.isDefault && (
                    <TouchableOpacity
                      onPress={() => onSetDefaultMFA(MFAType.Authenticator)}
                      className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 rounded"
                    >
                      <Text className="text-blue-700 dark:text-blue-300">
                        Set Default
                      </Text>
                    </TouchableOpacity>
                  )}
                  {!mfaSettings.find((m) => m.type === MFAType.Authenticator)
                    ?.isDefault && (
                    <TouchableOpacity
                      onPress={() => onRemoveMFA(MFAType.Authenticator)}
                      className="px-3 py-1 bg-red-100 dark:bg-red-900/30 rounded"
                    >
                      <Text className="text-red-700 dark:text-red-300">
                        Remove
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => onEnableMFA(MFAType.Authenticator)}
                  className="px-3 py-1 bg-green-100 dark:bg-green-900/30 rounded"
                >
                  <Text className="text-green-700 dark:text-green-300">
                    Enable
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Phone Number MFA */}
        <View className="border dark:border-gray-700 rounded-lg p-4">
          <View className="flex-row justify-between items-start">
            <View className="flex-row items-start">
              <View className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-full mr-3">
                <Ionicons name="call" size={24} color="#D97706" />
              </View>
              <View>
                <Text className="font-medium text-gray-900 dark:text-white">
                  Phone Number
                </Text>
                <Text className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  Receive a verification code via SMS when logging in from a new
                  device.
                </Text>
                <View className="mt-2 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full self-start">
                  <Text className="text-gray-600 dark:text-gray-300 text-xs">
                    Coming Soon
                  </Text>
                </View>
              </View>
            </View>
            <View>
              <TouchableOpacity
                disabled
                className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded"
              >
                <Text className="text-gray-400 dark:text-gray-500">Enable</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
