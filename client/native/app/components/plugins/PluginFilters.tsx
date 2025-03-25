import React, { useState } from "react";
import { View, Text, TouchableOpacity, Switch } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import {
  PaymentType,
  PlatformType,
  VerificationStatus,
} from "@/lib/api/PluginAPI";

interface PluginFiltersProps {
  onFilterChange: (filters: any) => void;
}

export default function PluginFilters({ onFilterChange }: PluginFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState({
    platforms: PlatformType.All,
    paymentType: undefined,
    minVerificationStatuses: [VerificationStatus.Verified],
    sortBy: "installationCount",
    sortDirection: "desc",
  });

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <View className="mb-6">
      <TouchableOpacity
        onPress={() => setIsOpen(!isOpen)}
        className="flex-row items-center mb-2"
      >
        <Ionicons
          name={isOpen ? "chevron-down" : "chevron-forward"}
          size={24}
          color="#6B7280"
        />
        <Text className="text-gray-700 dark:text-gray-300 ml-2">
          {isOpen ? "Hide Filters" : "Show Filters"}
        </Text>
      </TouchableOpacity>

      {isOpen && (
        <View className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              Platform
            </Text>
            <Picker
              selectedValue={filters.platforms}
              onValueChange={(itemValue) =>
                handleFilterChange("platforms", itemValue)
              }
              className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <Picker.Item label="All Platforms" value={PlatformType.All} />
              <Picker.Item label="Web" value={PlatformType.Web} />
              <Picker.Item label="Mobile" value={PlatformType.Mobile} />
              <Picker.Item label="Desktop" value={PlatformType.Desktop} />
            </Picker>
          </View>

          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              Price
            </Text>
            <Picker
              selectedValue={filters.paymentType}
              onValueChange={(itemValue) =>
                handleFilterChange("paymentType", itemValue)
              }
              className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <Picker.Item label="All" value={undefined} />
              <Picker.Item label="Free" value={PaymentType.Free} />
              <Picker.Item label="Paid" value={PaymentType.OneTime} />
            </Picker>
          </View>

          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              Sort By
            </Text>
            <Picker
              selectedValue={`${filters.sortBy}-${filters.sortDirection}`}
              onValueChange={(itemValue) => {
                const [sortBy, sortDirection] = itemValue.split("-");
                handleFilterChange("sortBy", sortBy);
                handleFilterChange("sortDirection", sortDirection);
              }}
              className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <Picker.Item
                label="Most Popular"
                value="installationCount-desc"
              />
              <Picker.Item label="Newest" value="createdAt-desc" />
              <Picker.Item label="Highest Rated" value="averageRating-desc" />
              <Picker.Item label="Name (A-Z)" value="title-asc" />
              <Picker.Item label="Name (Z-A)" value="title-desc" />
            </Picker>
          </View>

          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-gray-700 dark:text-gray-300">
              Verified only
            </Text>
            <Switch
              value={filters.minVerificationStatuses.includes(
                VerificationStatus.Verified
              )}
              onValueChange={(value) => {
                const newStatuses = value ? [VerificationStatus.Verified] : [];
                handleFilterChange("minVerificationStatuses", newStatuses);
              }}
            />
          </View>

          <TouchableOpacity
            onPress={() => {
              const defaultFilters = {
                platforms: PlatformType.All,
                paymentType: undefined,
                minVerificationStatuses: [VerificationStatus.Verified],
                sortBy: "installationCount",
                sortDirection: "desc",
              };
              setFilters(defaultFilters);
              onFilterChange(defaultFilters);
            }}
            className="items-center"
          >
            <Text className="text-sm text-blue-600 dark:text-blue-400">
              Reset Filters
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
