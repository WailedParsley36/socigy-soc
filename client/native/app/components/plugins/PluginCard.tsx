import React, { useState } from "react";
import { View, Text, Image, Pressable } from "react-native";
import { Link } from "expo-router";
import PluginInstallButton from "./PluginInstallButton";
import { PluginRecommendation, VerificationStatus } from "@/lib/api/PluginAPI";
import { PluginStore } from "@/stores/PluginStore";

interface PluginCardProps {
  plugin: PluginRecommendation;
  pluginStore: PluginStore;
}

export default function PluginCard({ plugin, pluginStore }: PluginCardProps) {
  const [isInstalled, setIsInstalled] = useState(
    pluginStore.isInstalled(plugin.plugin_id)
  );

  return (
    <View className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md flex flex-col">
      <Link href={`/app/plugins/${plugin.plugin_id}`} asChild>
        <Pressable>
          <View className="h-40 bg-gray-100 dark:bg-gray-700 relative">
            {plugin.iconUrl ? (
              <Image
                source={{ uri: plugin.iconUrl }}
                className="w-full h-full object-cover"
                accessibilityLabel={plugin.title}
              />
            ) : (
              <View className="w-full h-full items-center justify-center text-gray-400">
                <Text className="text-gray-400">No Image</Text>
              </View>
            )}

            {plugin.verificationStatus === VerificationStatus.Verified && (
              <View className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                <Text>Verified</Text>
              </View>
            )}
          </View>
        </Pressable>
      </Link>

      <View className="p-4 flex-grow">
        <Link href={`/app/plugins/${plugin.plugin_id}`} asChild>
          <Pressable>
            <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              {plugin.title}
            </Text>
            <Text className="text-sm text-gray-600 dark:text-gray-300 mb-3">
              {plugin.description || "No description available"}
            </Text>

            <View className="flex-row items-center text-sm text-gray-500 dark:text-gray-400">
              <View className="flex-row items-center mr-4">
                <Text className="mr-1">⭐</Text>
                <Text>{plugin.avgRating.toFixed(1)}</Text>
              </View>
              <View className="flex-row items-center">
                <Text className="mr-1">⬇️</Text>
                <Text>{plugin.installationCount}</Text>
              </View>
            </View>
          </Pressable>
        </Link>
      </View>

      <View className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-100 dark:border-gray-600">
        <View className="flex-row justify-between items-center">
          {isInstalled ? (
            <View className="flex-row items-center">
              <Text className="text-sm font-medium text-green-600 dark:text-green-400 mr-1">
                ✔️
              </Text>
              <Text>Installed</Text>
            </View>
          ) : (
            <PluginInstallButton
              plugin={plugin}
              size="sm"
              onSuccess={() => setIsInstalled(true)}
            />
          )}
          <Text className="text-xs text-gray-500 dark:text-gray-400">
            {new Date(plugin.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
    </View>
  );
}
