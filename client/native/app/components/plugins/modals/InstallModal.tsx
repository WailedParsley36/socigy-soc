import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useToast } from "@/contexts/ToastContext";
import { PluginRecommendation, PaymentType } from "@/lib/api/PluginAPI";
import { Guid } from "@/lib/structures/Guid";
import VersionSelector from "../VersionSelector";
import { usePluginStore } from "@/stores/PluginStore";
import { Modal } from "react-native-paper";

interface InstallModalProps {
  plugin: PluginRecommendation;
  visible: boolean;
  onClose: () => void;
  onSuccess: (installationId: Guid) => void;
}

export default function InstallModal({
  plugin,
  visible,
  onClose,
  onSuccess,
}: InstallModalProps) {
  const [selectedVersionId, setSelectedVersionId] = useState<
    Guid | undefined
  >();
  const [installing, setInstalling] = useState(false);
  const { showToast } = useToast();
  const pluginStore = usePluginStore();

  const handleVersionSelect = (versionId: Guid) => {
    setSelectedVersionId(versionId);
  };

  const handleInstall = async () => {
    if (!selectedVersionId) {
      showToast({
        title: "Version Required",
        description: "Please select a version to install",
        type: "warning",
      });
      return;
    }

    setInstalling(true);

    try {
      if (plugin.paymentType !== PaymentType.Free) {
        showToast({
          title: "Payment Required",
          description: `This plugin costs $${plugin.price?.toFixed(
            2
          )}. Redirecting to payment...`,
          type: "info",
        });
        // TODO: Implement payment flow
        return;
      }

      const response = await pluginStore.installPlugin(
        plugin.plugin_id,
        selectedVersionId as Guid
      );

      showToast({
        title: "Installation Successful",
        description: `${plugin.title} has been installed successfully.`,
        type: "success",
      });

      onSuccess(response.installation_id);
      onClose();
    } catch (error) {
      console.error("Installation failed:", error);
      showToast({
        title: "Installation Failed",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
        type: "error",
      });
    } finally {
      setInstalling(false);
    }
  };

  return (
    <Modal visible={visible} onDismiss={onClose}>
      <View className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
        <ScrollView className="px-4 py-5">
          <Text className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Install {plugin.title}
          </Text>

          {plugin.iconUrl && (
            <View className="flex-row items-center mb-4">
              <Image
                source={{ uri: plugin.iconUrl }}
                className="w-12 h-12 rounded-md mr-4"
              />
              <View>
                <Text className="font-medium text-gray-900 dark:text-white">
                  {plugin.title}
                </Text>
                <Text className="text-sm text-gray-500 dark:text-gray-400">
                  {plugin.paymentType === PaymentType.Free
                    ? "Free"
                    : `$${plugin.price?.toFixed(2)}`}
                </Text>
              </View>
            </View>
          )}

          <View className="mb-4">
            <VersionSelector
              pluginId={plugin.plugin_id}
              onVersionSelect={handleVersionSelect}
            />
          </View>

          <View className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md mb-4">
            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Plugin Details
            </Text>
            <View className="space-y-1">
              <Text className="text-sm text-gray-600 dark:text-gray-400">
                <Text className="font-medium">Developer:</Text>{" "}
                {plugin.developerUsername || "Unknown"}
              </Text>
              <Text className="text-sm text-gray-600 dark:text-gray-400">
                <Text className="font-medium">Platforms:</Text>{" "}
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
              <Text className="text-sm text-gray-600 dark:text-gray-400">
                <Text className="font-medium">Rating:</Text>{" "}
                {plugin.avgRating.toFixed(1)} ({plugin.reviewCount} reviews)
              </Text>
              <Text className="text-sm text-gray-600 dark:text-gray-400">
                <Text className="font-medium">Installations:</Text>{" "}
                {plugin.installationCount}
              </Text>
            </View>
          </View>

          <Text className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            By installing this plugin, you agree to the plugin's terms of
            service and privacy policy.
          </Text>
        </ScrollView>

        <View className="bg-gray-50 dark:bg-gray-700 px-4 py-3 flex-row justify-end">
          <Pressable
            onPress={onClose}
            disabled={installing}
            className="mr-3 px-4 py-2 bg-white dark:bg-gray-800 rounded-md"
          >
            <Text className="text-gray-700 dark:text-gray-300 font-medium">
              Cancel
            </Text>
          </Pressable>
          <Pressable
            onPress={handleInstall}
            disabled={installing || !selectedVersionId}
            className={`px-4 py-2 rounded-md ${
              plugin.paymentType === PaymentType.Free
                ? "bg-blue-600 active:bg-blue-700"
                : "bg-green-600 active:bg-green-700"
            } ${(installing || !selectedVersionId) && "opacity-50"}`}
          >
            {installing ? (
              <View className="flex-row items-center">
                <ActivityIndicator
                  size="small"
                  color="white"
                  className="mr-2"
                />
                <Text className="text-white font-medium">Installing...</Text>
              </View>
            ) : (
              <Text className="text-white font-medium">
                {plugin.paymentType === PaymentType.Free
                  ? "Install"
                  : `Buy $${plugin.price?.toFixed(2)}`}
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
