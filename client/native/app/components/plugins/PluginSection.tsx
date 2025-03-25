import React, { useState, useEffect } from "react";
import { View, Text, Pressable, FlatList } from "react-native";
import { useRouter } from "expo-router";
import PluginCard from "./PluginCard";
import type { PluginRecommendation } from "@/lib/api/PluginAPI";
import { usePluginStore } from "@/stores/PluginStore";

interface PluginSectionProps {
  title: string;
  description: string;
  fetchFunction: (options: any) => Promise<any>;
  href: string;
}

export default function PluginSection({
  title,
  description,
  fetchFunction,
  href,
}: PluginSectionProps) {
  const store = usePluginStore();
  const [plugins, setPlugins] = useState<PluginRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadPlugins = async () => {
      setLoading(true);
      try {
        const response = await fetchFunction({ limit: 8 });
        if (response.result) {
          setPlugins(response.result);
        }
      } catch (error) {
        console.error("Failed to load plugins:", error);
      } finally {
        setLoading(false);
      }
    };

    loadPlugins();
  }, [fetchFunction]);

  const renderItem = ({ item }: { item: PluginRecommendation }) => (
    <PluginCard plugin={item} pluginStore={store} />
  );

  const renderSkeleton = () => (
    <View className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg" />
  );

  return (
    <View className="mb-8">
      <View className="mb-6">
        <Text className="text-2xl font-bold text-gray-900 dark:text-white">
          {title}
        </Text>
        <Text className="text-gray-600 dark:text-gray-300">{description}</Text>
      </View>

      {loading ? (
        <FlatList
          data={[...Array(4)]}
          renderItem={renderSkeleton}
          keyExtractor={(_, index) => index.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 16 }}
        />
      ) : (
        <FlatList
          data={plugins}
          renderItem={renderItem}
          keyExtractor={(item) => item.plugin_id.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 16 }}
        />
      )}

      <View className="mt-6 items-center">
        <Pressable
          onPress={() => router.push(`/app/plugins/category/${href}`)}
          className="px-6 py-2 bg-transparent border border-blue-600 rounded-lg active:bg-blue-50 dark:active:bg-blue-900"
        >
          <Text className="text-blue-600">View All {title}</Text>
        </Pressable>
      </View>
    </View>
  );
}
