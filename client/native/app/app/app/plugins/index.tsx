import React from "react";
import { View, ScrollView } from "react-native";
import PluginStoreHeader from "@/components/plugins/PluginStoreHeader";
import PluginSection from "@/components/plugins/PluginSection";
import SearchBar from "@/components/plugins/SearchBar";
import { PluginAPI } from "@/lib/api/PluginAPI";

export default function PluginStorePage() {
  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900">
      <PluginStoreHeader />

      <ScrollView className="flex-1 px-4 py-8">
        <View className="mb-8">
          <SearchBar />
        </View>

        <View className="space-y-12">
          <PluginSection
            title="Staff Picks"
            description="Curated plugins recommended by our team"
            fetchFunction={PluginAPI.getStaffPicksPlugins}
            href="staff-picks"
          />

          <PluginSection
            title="Hot Plugins"
            description="Popular plugins trending right now"
            fetchFunction={PluginAPI.getHotPlugins}
            href="hot"
          />

          <PluginSection
            title="New Arrivals"
            description="Recently added plugins to discover"
            fetchFunction={PluginAPI.getNewArrivalsPlugins}
            href="new"
          />

          <PluginSection
            title="Recommended For You"
            description="Personalized recommendations based on your usage"
            fetchFunction={PluginAPI.getRecommendedForYouPlugins}
            href="recommended"
          />
        </View>
      </ScrollView>
    </View>
  );
}
