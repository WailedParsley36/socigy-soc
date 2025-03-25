import React from "react";
import { View, ScrollView } from "react-native";
import { useLocalSearchParams } from "expo-router";
import PluginHeader from "@/components/plugins/PluginHeader";
import PluginDetails from "@/components/plugins/PluginDetails";
import PluginVersions from "@/components/plugins/PluginVersion";
import PluginReviews from "@/components/plugins/PluginReviews";
import type { Guid } from "@/lib/structures/Guid";

export default function PluginDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const pluginId = id as Guid;

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900">
      <PluginHeader pluginId={pluginId} />

      <ScrollView className="flex-1 px-4 py-8">
        <View className="flex-col lg:flex-row">
          <View className="flex-1 lg:mr-8">
            <PluginDetails pluginId={pluginId} />
            <PluginVersions pluginId={pluginId} />
          </View>

          <View className="flex-1 lg:flex-[0.5]">
            <PluginReviews pluginId={pluginId} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
