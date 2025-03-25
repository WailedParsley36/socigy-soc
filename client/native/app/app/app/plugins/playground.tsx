import React from "react";
import { View, Text, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function Playground() {
  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <Header />
      <View className="px-4 py-8">
        <BasePlaygroundBody />
      </View>
    </ScrollView>
  );
}

function Header() {
  return (
    <LinearGradient
      colors={["#2563EB", "#4F46E5"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      className="p-4 py-12"
    >
      <View className="flex-col md:flex-row items-start md:items-center gap-6">
        <View className="flex-1">
          <Text className="text-3xl md:text-4xl font-bold mb-2 text-white">
            Plugin Playground
          </Text>
          <Text className="text-lg opacity-90 mb-4 text-white">
            Here you can see the plugins in action!
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}

export function BasePlaygroundBody() {
  return <Text>It seems that no plugin is taking advantage of me 🥲</Text>;
}
