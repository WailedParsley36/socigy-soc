import React, { useState, useEffect } from "react";
import { View, Text, Image, ScrollView, Pressable } from "react-native";
import { PluginAPI, PluginRecommendation } from "@/lib/api/PluginAPI";
import type { Guid } from "@/lib/structures/Guid";

interface PluginDetailsProps {
  pluginId: Guid;
}

export default function PluginDetails({ pluginId }: PluginDetailsProps) {
  const [plugin, setPlugin] = useState<PluginRecommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [pluginVersion, setPluginVersion] = useState<string>();

  useEffect(() => {
    const loadPlugin = async () => {
      try {
        const response = await PluginAPI.getPluginDetails(pluginId);
        if (response.result) {
          setPlugin(response.result);
        }

        setPluginVersion(
          (await PluginAPI.getPluginVersions(pluginId)).result?.[0]
            .versionString ?? "X.X.X"
        );
      } catch (error) {
        console.error("Failed to load plugin details:", error);
      } finally {
        setLoading(false);
      }
    };

    loadPlugin();
  }, [pluginId]);

  if (loading) {
    return (
      <View className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <View className="h-7 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
        <View className="space-y-3">
          <View className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
          <View className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
          <View className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6" />
        </View>
      </View>
    );
  }

  if (!plugin) {
    return (
      <View className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <Text className="text-red-500 dark:text-red-400">
          Failed to load plugin details
        </Text>
      </View>
    );
  }

  return (
    <ScrollView className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm mb-8">
      <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        About This Plugin
      </Text>

      <Text className="text-gray-700 dark:text-gray-300 mb-8">
        {plugin.description || "No description available"}
      </Text>

      <View className="mb-8">
        <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Details
        </Text>

        <View className="space-y-2">
          <View className="flex-row justify-between">
            <Text className="text-gray-600 dark:text-gray-400">Version</Text>
            <Text className="text-gray-900 dark:text-white font-medium">
              {pluginVersion ?? "X.X.X"}
            </Text>
          </View>

          <View className="flex-row justify-between">
            <Text className="text-gray-600 dark:text-gray-400">Released</Text>
            <Text className="text-gray-900 dark:text-white font-medium">
              {new Date(plugin.createdAt).toLocaleDateString()}
            </Text>
          </View>

          <View className="flex-row justify-between">
            <Text className="text-gray-600 dark:text-gray-400">Price</Text>
            <Text className="text-gray-900 dark:text-white font-medium">
              {plugin.paymentType === 0
                ? "Free"
                : `$${plugin.price?.toFixed(2)}`}
            </Text>
          </View>

          <View className="flex-row justify-between">
            <Text className="text-gray-600 dark:text-gray-400">Platforms</Text>
            <Text className="text-gray-900 dark:text-white font-medium">
              {plugin.platforms === 7
                ? "All Platforms"
                : [
                    plugin.platforms & 1 ? "Web" : "",
                    plugin.platforms & 2 ? "Mobile" : "",
                    plugin.platforms & 4 ? "Desktop" : "",
                  ]
                    .filter(Boolean)
                    .join(", ")}
            </Text>
          </View>
        </View>
      </View>

      <View>
        <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Developer
        </Text>

        <View className="flex-row items-center">
          <View className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mr-4 items-center justify-center">
            {plugin.developerIconUrl ? (
              <Image
                source={{ uri: plugin.developerIconUrl }}
                style={{ width: 32, height: 32 }}
                className="h-full w-full object-cover"
              />
            ) : (
              <Text className="text-blue-600 font-medium text-lg">
                {plugin.developerUsername?.charAt(0) || "U"}
              </Text>
            )}
          </View>

          <View>
            <Text className="font-medium text-gray-900 dark:text-white">
              {plugin.developerUsername} #{plugin.developerTag}
            </Text>
            <Text className="text-sm text-gray-600 dark:text-gray-400">
              {plugin.developerEmail}
            </Text>
          </View>
        </View>

        <View className="mt-4">
          <Pressable>
            <Text className="text-blue-600 dark:text-blue-400 text-sm font-medium">
              View all plugins by this developer
            </Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}
