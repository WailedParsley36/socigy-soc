import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Guid } from "@/lib/structures/Guid";
import {
  PluginAPI,
  PluginVersion,
  VerificationStatus,
} from "@/lib/api/PluginAPI";
import { Feather } from "@expo/vector-icons";

interface VersionSelectorProps {
  pluginId: Guid;
  onVersionSelect: (versionId: Guid) => void;
  initialVersionId?: Guid;
}

export default function VersionSelector({
  pluginId,
  onVersionSelect,
  initialVersionId,
}: VersionSelectorProps) {
  const [versions, setVersions] = useState<PluginVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersionId, setSelectedVersionId] = useState<Guid | undefined>(
    initialVersionId
  );
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const loadVersions = async () => {
      setLoading(true);
      try {
        const response = await PluginAPI.getPluginVersions(pluginId);
        if (response.error) throw new Error("Failed");

        const data = response.result!;
        setVersions(data);
        if (!initialVersionId) {
          const latestStable = data.find(
            (v: PluginVersion) => v.isActive && !v.isBeta
          );
          if (latestStable) {
            setSelectedVersionId(latestStable.version_id);
            onVersionSelect(latestStable.version_id);
          } else if (data.length > 0) {
            setSelectedVersionId(data[0].version_id);
            onVersionSelect(data[0].version_id);
          }
        }
      } catch (error) {
        console.error("Failed to load plugin versions:", error);
      } finally {
        setLoading(false);
      }
    };

    loadVersions();
  }, [pluginId, initialVersionId, onVersionSelect]);

  const handleVersionSelect = (versionId: Guid) => {
    setSelectedVersionId(versionId);
    onVersionSelect(versionId);
    setIsOpen(false);
  };

  const selectedVersion = versions.find(
    (v: PluginVersion) => v.version_id === selectedVersionId
  );

  return (
    <View className="relative">
      <Text className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
        Select Version
      </Text>

      <Pressable
        className="relative w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm px-3 py-2"
        onPress={() => setIsOpen(!isOpen)}
      >
        {loading ? (
          <View className="flex-row items-center">
            <ActivityIndicator size="small" color="#9CA3AF" className="mr-2" />
            <Text>Loading versions...</Text>
          </View>
        ) : selectedVersion ? (
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Text className="mr-2 text-gray-600">
                v{selectedVersion.versionString}
              </Text>
              {selectedVersion.isActive && !selectedVersion.isBeta && (
                <View className="px-2 py-0.5 rounded bg-green-100 dark:bg-green-900">
                  <Text className="text-xs font-medium text-green-800 dark:text-green-200">
                    Stable
                  </Text>
                </View>
              )}
              {selectedVersion.isBeta && (
                <View className="px-2 py-0.5 rounded bg-yellow-100 dark:bg-yellow-900">
                  <Text className="text-xs font-medium text-yellow-800 dark:text-yellow-200">
                    Beta
                  </Text>
                </View>
              )}
              {selectedVersion.verificationStatus ===
                VerificationStatus.Verified && (
                <View className="ml-2 px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900">
                  <Text className="text-xs font-medium text-blue-800 dark:text-blue-200">
                    Verified
                  </Text>
                </View>
              )}
            </View>
            <Text className="text-gray-500 text-sm">
              {new Date(
                selectedVersion.createdAt || Date.now()
              ).toLocaleDateString()}
            </Text>
          </View>
        ) : (
          <Text className="text-gray-500">No versions available</Text>
        )}

        <View className="absolute right-2 top-1/2 -mt-2">
          <Feather name="chevron-down" size={20} color="#9CA3AF" />
        </View>
      </Pressable>

      {isOpen && (
        <ScrollView className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg max-h-60 rounded-md py-1 border border-gray-200 dark:border-gray-700">
          {versions.length === 0 ? (
            <Text className="text-center py-2 px-4 text-gray-500">
              No versions available
            </Text>
          ) : (
            versions.map((version) => (
              <Pressable
                key={version.version_id.toString()}
                className={`px-4 py-2 ${
                  selectedVersionId === version.version_id
                    ? "bg-gray-100 dark:bg-gray-700"
                    : ""
                }`}
                onPress={() => handleVersionSelect(version.version_id)}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Text className="mr-2 text-gray-600">
                      v{version.versionString}
                    </Text>
                    {version.isActive && !version.isBeta && (
                      <View className="px-2 py-0.5 rounded bg-green-100 dark:bg-green-900">
                        <Text className="text-xs font-medium text-green-800 dark:text-green-200">
                          Stable
                        </Text>
                      </View>
                    )}
                    {version.isBeta && (
                      <View className="px-2 py-0.5 rounded bg-yellow-100 dark:bg-yellow-900">
                        <Text className="text-xs font-medium text-yellow-800 dark:text-yellow-200">
                          Beta
                        </Text>
                      </View>
                    )}
                    {version.verificationStatus ===
                      VerificationStatus.Verified && (
                      <View className="ml-2 px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900">
                        <Text className="text-xs font-medium text-blue-800 dark:text-blue-200">
                          Verified
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-gray-500 text-sm">
                    {new Date(
                      version.createdAt || Date.now()
                    ).toLocaleDateString()}
                  </Text>
                </View>

                {version.releaseNotes && (
                  <Text className="mt-1 text-sm text-gray-500 dark:text-gray-400 numberOfLines={2}">
                    {version.releaseNotes}
                  </Text>
                )}
              </Pressable>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}
