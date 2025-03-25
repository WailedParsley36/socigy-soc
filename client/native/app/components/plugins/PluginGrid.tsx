import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import PluginCard from "./PluginCard";
import PluginFilters from "./PluginFilters";
import {
  PluginRecommendation,
  PluginRecommendationRequest,
} from "@/lib/api/PluginAPI";
import { usePluginStore } from "@/stores/PluginStore";

interface PluginGridProps {
  fetchFunction: (options: PluginRecommendationRequest) => Promise<any>;
  initialLimit?: number;
}

export default function PluginGrid({
  fetchFunction,
  initialLimit = 20,
}: PluginGridProps) {
  const store = usePluginStore();
  const [plugins, setPlugins] = useState<PluginRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [filters, setFilters] = useState<Partial<PluginRecommendationRequest>>(
    {}
  );
  const limit = initialLimit;

  const loadPlugins = async (reset = false) => {
    if (reset) {
      setOffset(0);
      setPlugins([]);
    }

    setLoading(true);
    try {
      const newOffset = reset ? 0 : offset;
      const response = await fetchFunction({
        limit,
        offset: newOffset,
        ...filters,
      });

      if (response.result) {
        if (reset) {
          setPlugins(response.result);
        } else {
          setPlugins((prev) => [...prev, ...response.result]);
        }
        setHasMore(response.result.length === limit);
        setOffset(newOffset + response.result.length);
      }
    } catch (error) {
      console.error("Failed to load plugins:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlugins(true);
  }, [fetchFunction, filters]);

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  const renderItem = ({ item }: { item: PluginRecommendation }) => (
    <View className="p-2 w-1/2">
      <PluginCard plugin={item} pluginStore={store} />
    </View>
  );

  const renderFooter = () => {
    if (!hasMore) return null;

    return (
      <View className="mt-10 items-center">
        <TouchableOpacity
          onPress={() => loadPlugins(false)}
          disabled={loading}
          className={`px-6 py-3 bg-blue-600 rounded-lg ${
            loading ? "opacity-50" : ""
          }`}
        >
          <Text className="text-white">
            {loading ? "Loading..." : "Load More"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;

    return (
      <View className="py-12 items-center">
        <Text className="text-gray-500 text-lg">No plugins found</Text>
        <Text className="text-gray-400 mt-2">
          Try adjusting your filters or search terms
        </Text>
      </View>
    );
  };

  return (
    <View className="flex-1">
      <PluginFilters onFilterChange={handleFilterChange} />

      <FlatList
        data={plugins}
        renderItem={renderItem}
        keyExtractor={(item) => item.plugin_id.toString()}
        numColumns={2}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        contentContainerStyle={{ paddingBottom: 20 }}
        onEndReached={() => !loading && hasMore && loadPlugins(false)}
        onEndReachedThreshold={0.1}
        ListHeaderComponent={
          loading ? (
            <View className="flex-row flex-wrap">
              {[...Array(4)].map((_, i) => (
                <View key={`skeleton-${i}`} className="w-1/2 p-2">
                  <View className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                </View>
              ))}
            </View>
          ) : null
        }
      />
    </View>
  );
}
