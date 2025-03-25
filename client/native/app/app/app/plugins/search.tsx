import React from "react";
import { View, Text, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import PluginGrid from "@/components/plugins/PluginGrid";
import SearchBar from "@/components/plugins/SearchBar";
import { PluginAPI } from "@/lib/api/PluginAPI";
import { useLocalSearchParams } from "expo-router";

export default function PluginSearchPage() {
  const { q: query = "" } = useLocalSearchParams();

  const searchPlugins = async (options: any) => {
    return PluginAPI.queryPlugins({
      ...options,
      search: query,
    });
  };

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900">
      <LinearGradient
        colors={["#2563eb", "#4f46e5"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        className="px-4 py-12"
      >
        <Text className="text-4xl font-bold mb-4 text-white">
          Search Results
        </Text>
        <Text className="text-xl opacity-90 text-white">
          {query
            ? `Showing results for "${query}"`
            : "Enter a search term to find plugins"}
        </Text>
      </LinearGradient>

      <ScrollView className="flex-1 px-4 py-8">
        <View className="mb-8">
          <SearchBar initialQuery={query as string} />
        </View>

        {query ? (
          <PluginGrid fetchFunction={searchPlugins} />
        ) : (
          <View className="items-center justify-center py-12">
            <Text className="text-gray-500 dark:text-gray-400 text-lg text-center">
              Enter a search term to find plugins
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
