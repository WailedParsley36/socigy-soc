import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PluginAPI, PluginVersion } from "@/lib/api/PluginAPI";
import { Guid } from "@/lib/structures/Guid";

interface PluginVersionsProps {
  pluginId: Guid;
}

export default function PluginVersions({ pluginId }: PluginVersionsProps) {
  const [versions, setVersions] = useState<PluginVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedVersion, setExpandedVersion] = useState<Guid | null>(null);

  useEffect(() => {
    const loadVersions = async () => {
      try {
        const response = await PluginAPI.getPluginVersions(pluginId);
        if (response.result) {
          setVersions(response.result);
          if (response.result.length > 0) {
            setExpandedVersion(response.result[0].version_id);
          }
        }
      } catch (error) {
        console.error("Failed to load plugin versions:", error);
      } finally {
        setLoading(false);
      }
    };

    loadVersions();
  }, [pluginId]);

  if (loading) {
    return (
      <View className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  if (versions.length === 0) {
    return (
      <View className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Version History
        </Text>
        <Text className="text-gray-600 dark:text-gray-400">
          No versions available
        </Text>
      </View>
    );
  }

  const renderVersion = ({ item: version }: { item: PluginVersion }) => (
    <View className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden mb-4">
      <TouchableOpacity
        className="flex-row justify-between items-center p-4"
        onPress={() =>
          setExpandedVersion(
            expandedVersion === version.version_id ? null : version.version_id
          )
        }
      >
        <View>
          <Text className="font-medium text-gray-900 dark:text-white">
            Version {version.versionString}
          </Text>
          <Text className="text-sm text-gray-600 dark:text-gray-400">
            Released on {new Date(version.createdAt).toLocaleDateString()}
          </Text>
        </View>

        <View className="flex-row items-center">
          {version.isActive && (
            <View className="px-2 py-1 bg-green-100 rounded-full mr-3">
              <Text className="text-green-800 text-xs">Active</Text>
            </View>
          )}
          {version.isBeta && (
            <View className="px-2 py-1 bg-yellow-100 rounded-full mr-3">
              <Text className="text-yellow-800 text-xs">Beta</Text>
            </View>
          )}
          <Ionicons
            name={
              expandedVersion === version.version_id
                ? "chevron-up"
                : "chevron-down"
            }
            size={24}
            color="#9CA3AF"
          />
        </View>
      </TouchableOpacity>

      {expandedVersion === version.version_id && (
        <View className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
          <View className="mb-4">
            <Text className="font-medium text-gray-900 dark:text-white mb-2">
              Release Notes
            </Text>
            <Text className="text-gray-700 dark:text-gray-300">
              {version.releaseNotes || "No release notes available"}
            </Text>
          </View>

          <View>
            <Text className="font-medium text-gray-900 dark:text-white mb-2">
              Technical Details
            </Text>
            <Text className="text-gray-700 dark:text-gray-300">
              <Text className="font-medium">System API Version: </Text>
              {version.systemApiVersion}
            </Text>
            <Text className="text-gray-700 dark:text-gray-300">
              <Text className="font-medium">Language: </Text>
              {version.language}
            </Text>
            <Text className="text-gray-700 dark:text-gray-300">
              <Text className="font-medium">Verification Status: </Text>
              {version.verificationStatus === 0
                ? "Unverified"
                : version.verificationStatus === 1
                ? "Pending"
                : version.verificationStatus === 2
                ? "Verified"
                : "Malicious"}
            </Text>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <View className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
      <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        Version History
      </Text>
      <FlatList
        data={versions}
        renderItem={renderVersion}
        keyExtractor={(item) => item.version_id.toString()}
      />
    </View>
  );
}
