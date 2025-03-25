import React from "react";
import { View, Text, TouchableOpacity, FlatList } from "react-native";
import { format } from "date-fns";
import { Ionicons } from "@expo/vector-icons";
import { Device, DeviceType } from "@/lib/api/ProfileHelper";

interface DevicesPanelProps {
  devices: Device[];
  onEditDevice: (device: Device) => void;
  onRemoveDevice: (deviceId: number) => void;
  isLoading: boolean;
}

export default function DevicesPanel({
  devices,
  onEditDevice,
  onRemoveDevice,
  isLoading,
}: DevicesPanelProps) {
  const getDeviceTypeName = (type: DeviceType) => {
    switch (type) {
      case DeviceType.Desktop:
        return "Desktop";
      case DeviceType.Mobile:
        return "Mobile";
      case DeviceType.Tablet:
        return "Tablet";
      case DeviceType.Other:
        return "Other";
      default:
        return "Unknown";
    }
  };

  const getDeviceIcon = (type: DeviceType) => {
    switch (type) {
      case DeviceType.Desktop:
        return "desktop-outline";
      case DeviceType.Mobile:
        return "phone-portrait-outline";
      case DeviceType.Tablet:
        return "tablet-portrait-outline";
      default:
        return "hardware-chip-outline";
    }
  };

  if (isLoading) {
    return (
      <View className="bg-white dark:bg-gray-800 rounded-lg p-6">
        <View className="space-y-4">
          <View className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></View>
          <View className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></View>
          <View className="space-y-2">
            {[1, 2, 3].map((i) => (
              <View
                key={i}
                className="h-24 bg-gray-200 dark:bg-gray-700 rounded"
              ></View>
            ))}
          </View>
        </View>
      </View>
    );
  }

  const renderDevice = ({ item: device }: { item: Device }) => (
    <View
      className={`border rounded-lg p-4 mb-4 ${
        device.isBlocked
          ? "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800"
          : device.isCurrent
          ? "bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800"
          : "bg-white dark:bg-gray-700 dark:border-gray-600"
      }`}
    >
      <View className="flex-row justify-between items-start">
        <View className="flex-row items-start">
          <Ionicons
            name={getDeviceIcon(device.deviceType) as any}
            size={32}
            color="#6B7280"
            style={{ marginRight: 16 }}
          />
          <View>
            <Text className="font-medium text-gray-900 dark:text-white">
              {device.deviceName}
            </Text>
            <Text className="text-sm text-gray-600 dark:text-gray-300">
              {getDeviceTypeName(device.deviceType)}
            </Text>
            <View className="flex-row flex-wrap mt-2">
              {device.isCurrent && (
                <View className="bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full mr-2 mb-2">
                  <Text className="text-green-800 dark:text-green-300 text-xs">
                    Current Device
                  </Text>
                </View>
              )}
              {device.isTrusted && (
                <View className="bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded-full mr-2 mb-2">
                  <Text className="text-blue-800 dark:text-blue-300 text-xs">
                    Trusted
                  </Text>
                </View>
              )}
              {device.isBlocked && (
                <View className="bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded-full mr-2 mb-2">
                  <Text className="text-red-800 dark:text-red-300 text-xs">
                    Blocked
                  </Text>
                </View>
              )}
              {device.isNew && (
                <View className="bg-yellow-100 dark:bg-yellow-900/30 px-2 py-0.5 rounded-full mr-2 mb-2">
                  <Text className="text-yellow-800 dark:text-yellow-300 text-xs">
                    New
                  </Text>
                </View>
              )}
            </View>
            <Text className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {device.lastUsedAt
                ? `Last used: ${format(
                    new Date(device.lastUsedAt),
                    "MMM d, yyyy h:mm a"
                  )}`
                : `Created: ${format(
                    new Date(device.createdAt || new Date()),
                    "MMM d, yyyy"
                  )}`}
            </Text>
          </View>
        </View>
        <View className="flex-row space-x-2">
          <TouchableOpacity
            onPress={() => onEditDevice(device)}
            className="px-3 py-1 bg-gray-100 dark:bg-gray-600 rounded"
          >
            <Text className="text-gray-700 dark:text-gray-200">Edit</Text>
          </TouchableOpacity>
          {!device.isCurrent && (
            <TouchableOpacity
              onPress={() => onRemoveDevice(device.id)}
              className="px-3 py-1 bg-red-100 dark:bg-red-900/30 rounded"
            >
              <Text className="text-red-700 dark:text-red-300">Remove</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <View className="bg-white dark:bg-gray-800 rounded-lg p-6">
      <Text className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
        Your Devices
      </Text>
      <Text className="text-gray-600 dark:text-gray-300 mb-6">
        These are the devices that have logged into your account. You can
        rename, trust, or block devices for enhanced security.
      </Text>
      {devices.length === 0 ? (
        <View className="items-center py-8">
          <Ionicons name="desktop-outline" size={64} color="#9CA3AF" />
          <Text className="mt-4 text-gray-500 dark:text-gray-400">
            No devices found
          </Text>
        </View>
      ) : (
        <FlatList
          data={devices}
          renderItem={renderDevice}
          keyExtractor={(item) => item.id.toString()}
        />
      )}
    </View>
  );
}
