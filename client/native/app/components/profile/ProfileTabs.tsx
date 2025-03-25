import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface ProfileTabsProps {
  activeTab: number;
  onChange: (index: number) => void;
}

export default function ProfileTabs({ activeTab, onChange }: ProfileTabsProps) {
  const tabs = [
    {
      name: "Devices",
      icon: "laptop-outline",
    },
    {
      name: "Security",
      icon: "lock-closed-outline",
    },
    {
      name: "MFA",
      icon: "shield-checkmark-outline",
    },
  ];

  return (
    <View className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-1 flex-row space-x-1">
      {tabs.map((tab, index) => (
        <TouchableOpacity
          key={tab.name}
          onPress={() => onChange(index)}
          className={`flex-1 flex-row items-center justify-center py-3 px-4 rounded-lg ${
            activeTab === index ? "bg-blue-600" : "bg-transparent"
          }`}
        >
          <Ionicons
            name={tab.icon as any}
            size={20}
            color={activeTab === index ? "white" : "#6B7280"}
            style={{ marginRight: 8 }}
          />
          <Text
            className={`text-sm font-medium ${
              activeTab === index
                ? "text-white"
                : "text-gray-700 dark:text-gray-300"
            }`}
          >
            {tab.name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
