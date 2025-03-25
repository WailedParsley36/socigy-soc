import React from "react";
import { View, Text, Pressable } from "react-native";
import { Link } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

export default function PluginStoreHeader() {
  return (
    <LinearGradient
      colors={["#2563eb", "#4f46e5"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      className="px-4 py-12"
    >
      <Text className="text-4xl font-bold mb-4 mt-4 text-white">
        Plugin Store
      </Text>
      <Text className="text-xl opacity-90 text-white max-w-2xl">
        Discover powerful plugins to enhance your experience and boost
        productivity
      </Text>
    </LinearGradient>
  );
}
