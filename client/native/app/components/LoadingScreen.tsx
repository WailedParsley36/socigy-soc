import { useRoute } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React from "react";
import { View, Text, ActivityIndicator } from "react-native";

export default function LoadingScreen() {
  const router = useRouter();
  const route = useRoute();

  return (
    <View className="flex-1 justify-center items-center bg-gray-50">
      <View className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <View className="items-center">
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
        <Text className="text-center text-gray-600">Loading...</Text>
      </View>
    </View>
  );
}
