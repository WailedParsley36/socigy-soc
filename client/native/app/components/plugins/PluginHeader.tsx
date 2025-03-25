import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PluginAPI, PluginRecommendation } from "@/lib/api/PluginAPI";
import { Guid } from "@/lib/structures/Guid";
import PluginInstallButton from "./PluginInstallButton";
import { PluginInstallationAPI } from "@/lib/api/PluginInstallationHelper";
import { usePluginStore } from "@/stores/PluginStore";

interface PluginHeaderProps {
  pluginId: Guid;
}

export default function PluginHeader({ pluginId }: PluginHeaderProps) {
  const [plugin, setPlugin] = useState<PluginRecommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installationId, setInstallationId] = useState<string>();
  const pluginStore = usePluginStore();

  useEffect(() => {
    const loadPlugin = async () => {
      try {
        const response = await PluginAPI.getPluginDetails(pluginId);
        if (response.result) {
          setPlugin(response.result);
        }
      } catch (error) {
        console.error("Failed to load plugin details:", error);
      } finally {
        setLoading(false);
      }
    };

    const checkInstallationStatus = async () => {
      try {
        const installations = await PluginInstallationAPI.getInstallations();
        if (installations.result) {
          const installed = installations.result.find(
            (installation) =>
              installation.pluginId.toString() === pluginId.toString()
          );
          if (installed) {
            setInstallationId(installed.installation_id);
            setIsInstalled(true);
          }
        }
      } catch (error) {
        console.error("Failed to check installation status:", error);
      }
    };

    checkInstallationStatus();
    loadPlugin();
  }, [pluginId]);

  if (loading) {
    return (
      <View className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4">
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  if (!plugin) {
    return (
      <View className="bg-gradient-to-r from-red-600 to-red-700 p-4">
        <Text className="text-2xl font-bold text-white mb-2">
          Plugin Not Found
        </Text>
        <Text className="text-lg text-white opacity-90">
          The requested plugin could not be loaded
        </Text>
      </View>
    );
  }

  return (
    <View className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4">
      <View className="flex-row items-center mb-4">
        <View className="w-24 h-24 bg-white rounded-lg overflow-hidden shadow-lg mr-4">
          {plugin.iconUrl ? (
            <Image
              source={{ uri: plugin.iconUrl }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          ) : (
            <View className="w-full h-full items-center justify-center bg-gray-100">
              <Ionicons name="cube-outline" size={48} color="#9CA3AF" />
            </View>
          )}
        </View>

        <View className="flex-1">
          <Text className="text-2xl font-bold text-white mb-1">
            {plugin.title}
          </Text>
          <Text className="text-base text-white opacity-90 mb-2">
            {plugin.description || "No description available"}
          </Text>

          <View className="flex-row flex-wrap">
            <View className="flex-row items-center mr-4 mb-2">
              <Ionicons name="star" size={16} color="#ffffff" />
              <Text className="text-white ml-1">
                {plugin.avgRating.toFixed(1)} ({plugin.reviewCount} reviews)
              </Text>
            </View>

            <View className="flex-row items-center mr-4 mb-2">
              <Ionicons name="download-outline" size={16} color="#ffffff" />
              <Text className="text-white ml-1">
                {plugin.installationCount} installations
              </Text>
            </View>

            <View className="flex-row items-center mb-2">
              <Ionicons name="calendar-outline" size={16} color="#ffffff" />
              <Text className="text-white ml-1">
                {new Date(plugin.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View className="mt-4">
        {isInstalled ? (
          <>
            <View className="bg-gray-100 p-2 rounded-lg mb-2">
              <Text className="text-green-600 font-medium text-center">
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />{" "}
                Installed
              </Text>
            </View>
            <TouchableOpacity
              onPress={async () => {
                setIsInstalled(false);
                setInstallationId(undefined);
                await pluginStore.uninstallPlugin(installationId! as Guid);
              }}
              className="bg-red-600 p-2 rounded-lg mb-2"
            >
              <Text className="text-white font-medium text-center">
                Uninstall
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <PluginInstallButton
            plugin={plugin}
            size="lg"
            onSuccess={(id) => {
              setIsInstalled(true);
              setInstallationId(id);
            }}
          />
        )}

        <TouchableOpacity className="border border-white p-2 rounded-lg">
          <Text className="text-white font-medium text-center">
            Report Issue
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
