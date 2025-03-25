import React from "react";
import { View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function DeveloperHeader() {
  return (
    <LinearGradient
      colors={["#2563EB", "#4F46E5"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      className="px-4 py-8"
    >
      <View className="max-w-screen-xl mx-auto">
        <Text className="text-3xl font-bold text-white mb-2">
          Plugin Developer Dashboard
        </Text>
        <Text className="text-xl text-white opacity-90 max-w-2xl">
          Create, manage, and publish your plugins to the store
        </Text>
      </View>
    </LinearGradient>
  );
}
