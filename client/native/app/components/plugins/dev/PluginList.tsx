import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useToast } from "@/contexts/ToastContext";
import {
  PluginRecommendation,
  PluginAPI,
  PublishStatus,
  VerificationStatus,
} from "@/lib/api/PluginAPI";
import { Guid } from "@/lib/structures/Guid";

interface PluginListProps {
  plugins: PluginRecommendation[];
  loading: boolean;
  onEdit: (pluginId: string) => void;
  onRefresh: () => void;
}

export default function PluginList({
  plugins,
  loading,
  onEdit,
  onRefresh,
}: PluginListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { showToast } = useToast();

  const handleDelete = async (pluginId: Guid) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this plugin? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeletingId(pluginId);
            try {
              await PluginAPI.deletePlugin(pluginId);
              showToast({
                title: "Success",
                message: "Plugin deleted successfully",
                type: "success",
              });
              onRefresh();
            } catch (error) {
              console.error("Failed to delete plugin:", error);
              showToast({
                title: "Error",
                message: "Failed to delete plugin",
                type: "error",
              });
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  const getStatusBadge = (
    status: PublishStatus,
    verificationStatus: VerificationStatus
  ) => {
    const statusStyles = {
      [PublishStatus.Published]: "bg-green-100 text-green-800",
      [PublishStatus.Reviewing]: "bg-yellow-100 text-yellow-800",
      [PublishStatus.Preparing]: "bg-gray-100 text-gray-800",
      [PublishStatus.TakenDown]: "bg-red-100 text-red-800",
    };

    const statusText = {
      [PublishStatus.Published]: "Published",
      [PublishStatus.Reviewing]: "Under Review",
      [PublishStatus.Preparing]: "Draft",
      [PublishStatus.TakenDown]: "Taken Down",
    };

    return (
      <View className={`px-2 py-1 rounded-full ${statusStyles[status]}`}>
        <Text className="text-xs font-medium">{statusText[status]}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View className="bg-white rounded-lg shadow-sm">
        {[...Array(3)].map((_, i) => (
          <View key={i} className="p-4 border-b border-gray-200">
            <View className="h-6 bg-gray-200 rounded w-1/4 mb-2" />
            <View className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
            <View className="flex-row justify-between">
              <View className="h-8 bg-gray-200 rounded w-24" />
              <View className="h-8 bg-gray-200 rounded w-24" />
            </View>
          </View>
        ))}
      </View>
    );
  }

  if (plugins.length === 0) {
    return (
      <View className="bg-white rounded-lg shadow-sm p-8 items-center">
        <Text className="text-lg font-medium text-gray-900 mb-2">
          No Plugins Yet
        </Text>
        <Text className="text-gray-600 mb-4 text-center">
          You haven't created any plugins yet. Click the "Create New Plugin"
          button to get started.
        </Text>
      </View>
    );
  }

  return (
    <View className="bg-white rounded-lg shadow-sm">
      <FlatList
        data={plugins}
        keyExtractor={(item) => item.plugin_id.toString()}
        renderItem={({ item: plugin }) => (
          <View className="p-4 border-b border-gray-200">
            <View className="flex-row justify-between items-start">
              <View className="flex-1">
                <Text className="text-lg font-medium text-gray-900 mb-1">
                  {plugin.title}
                </Text>
                <Text className="text-gray-600 text-sm mb-2">
                  {plugin.description || "No description"}
                </Text>
                <View className="flex-row flex-wrap gap-2 mb-2">
                  {getStatusBadge(
                    plugin.publishStatus,
                    plugin.verificationStatus
                  )}
                  {plugin.verificationStatus ===
                    VerificationStatus.Verified && (
                    <View className="px-2 py-1 rounded-full bg-blue-100">
                      <Text className="text-xs font-medium text-blue-800">
                        Verified
                      </Text>
                    </View>
                  )}
                  <View className="px-2 py-1 rounded-full bg-purple-100">
                    <Text className="text-xs font-medium text-purple-800">
                      {plugin.installationCount} Installations
                    </Text>
                  </View>
                  <View className="px-2 py-1 rounded-full bg-orange-100">
                    <Text className="text-xs font-medium text-orange-800">
                      {plugin.reviewCount} Reviews
                    </Text>
                  </View>
                </View>
                <Text className="text-xs text-gray-500">
                  Created: {new Date(plugin.createdAt).toLocaleDateString()}
                </Text>
              </View>

              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={() => onEdit(plugin.plugin_id.toString())}
                  className="px-3 py-1 bg-blue-600 rounded"
                >
                  <Text className="text-white text-sm">Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleDelete(plugin.plugin_id)}
                  disabled={deletingId === plugin.plugin_id.toString()}
                  className={`px-3 py-1 rounded ${
                    deletingId === plugin.plugin_id.toString()
                      ? "bg-gray-400"
                      : "bg-red-600"
                  }`}
                >
                  <Text className="text-white text-sm">
                    {deletingId === plugin.plugin_id.toString()
                      ? "Deleting..."
                      : "Delete"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      />
    </View>
  );
}
