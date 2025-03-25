import React, { useCallback, useEffect, useState } from "react";
import { Pressable, View, Text, TouchableOpacity, Switch } from "react-native";
import { Image } from "expo-image";
import AppBackgroundBase from "@/components/background/AppBackgroundBase";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { usePluginManager, useUiRegistry } from "@/managers/Exports";
import { Plugin } from "@/data/plugins/Plugin";
import { useTabBarVisibility } from "@/contexts/TabBarVisibilityContext";

function NoPluginFound({ id }: { id: string | string[] }) {
  return (
    <View className="flex-1 items-center justify-center">
      <Text className="text-white text-2xl">
        Plugin with id {id} was not found
      </Text>
    </View>
  );
}

export const PermissionDescriptions = {
  "socigy.ui.components.replace":
    "Allows the plugin to replace built-in UI components",
  "socigy.ui.components.delete":
    "Allows the plugin to delete built-in UI components",
};

export default function Detail() {
  // Hooks
  const tabBar = useTabBarVisibility();
  const { id } = useLocalSearchParams();
  const plugins = usePluginManager();
  const uiRegistry = useUiRegistry();

  // Computed
  const localId = typeof id === "string" ? id : id[0];
  const isInstalled = plugins.isInstalled(localId);

  // States
  const [pluginInfo, setPluginInfo] = useState<Plugin | null>();
  const [userDevices, setUserDevices] =
    React.useState<{ name: string; installed: boolean }[]>();

  // Effects
  useFocusEffect(
    useCallback(() => {
      setPluginInfo((prev) => (prev ? { ...prev } : undefined));
    }, [])
  );
  useEffect(() => {
    tabBar.hide();

    plugins.getPluginAsync(localId).then((result) => {
      if (result.error) {
        setPluginInfo(undefined);
        return;
      }

      setPluginInfo(result.result as Plugin | null | undefined);
    });

    plugins.getUserDevicesStatusForPlugin(localId).then((result) => {
      setUserDevices(result);
    });
  }, [id]);

  // Callbacks
  const handlePluginInstall = async () => {
    // TODO: Make a context that would secure the state of the application
    if (isInstalled) {
      await plugins.uninstallPluginAsync(localId);
      setPluginInfo((prev) => ({ ...prev! }));
      return;
    }

    router.push(`/app/apps/detail/permissions?id=${id}`);
  };

  // Get plugin info
  if (pluginInfo == undefined) return <NoPluginFound id={localId} />;
  else if (pluginInfo == null) return <Text>Loading...</Text>;

  return (
    <AppBackgroundBase
      className="flex-1"
      isSafe={false}
      canScroll
      additionalScrollViewProps={{ contentContainerClassName: "pb-32" }}
    >
      {/* Header Section */}
      <View className="bg-level-4 px-5 pt-12">
        <View className="px-2">
          <View className="flex-row mt-12 mb-4">
            {pluginInfo.authors.map((_, i) => (
              <Image
                key={i}
                source={{
                  uri: "https://socigy.com/favicon/favicon.svg",
                }}
                className="w-12 h-12 rounded-full -ml-2"
                style={{ height: 32, width: 32 }}
              />
            ))}
          </View>

          {/* Title Section */}
          <Text className="text-white text-4xl font-bold mb-2">
            {pluginInfo.name}
          </Text>
          <Text className="text-white text-2xl mb-4">v1.0.0</Text>
        </View>

        {/* Main Install Button */}
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={handlePluginInstall}
          className="bg-white rounded-full py-4 mb-8 mt-5"
        >
          <Text className="text-black text-center text-lg font-semibold">
            {isInstalled ? "Uninstall" : "Install"}
          </Text>
        </TouchableOpacity>
      </View>

      <View className="px-5 mt-10">
        {/* Description */}
        <Text className="text-white text-lg mb-8">
          {pluginInfo.description}
        </Text>

        {/* Available Devices */}
        <Text className="text-white text-2xl font-semibold mb-4">
          Available devices
        </Text>

        {userDevices ? (
          userDevices.map((device, index) => (
            <View
              key={index}
              className="flex-row items-center justify-between mb-4"
            >
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-white rounded-full mr-3" />
                <Text className="text-white text-lg">{device.name}</Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.75}
                disabled
                className={`px-6 py-2 rounded-full ${
                  device.installed ? "bg-white" : "bg-white"
                }`}
              >
                <Text className="text-black font-semibold">
                  {device.installed ? "Not Available" : "Not Available"}
                </Text>
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <Text>Loading your devices...</Text>
        )}

        {/* Parameters Section */}
        <Text className="text-white text-2xl font-semibold mt-8 mb-4">
          Parameters
        </Text>
        <View className="mb-8">
          <Text className="text-white text-lg mb-2">
            Language:{" "}
            {pluginInfo.language[0].toUpperCase() +
              pluginInfo.language.substring(1)}
          </Text>
          <Text className="text-white text-lg">
            API Version: v
            {pluginInfo.apiVersion.replaceAll("^", "").replaceAll("~", "")}
          </Text>
        </View>

        {/* Permissions Section */}
        <Text className="text-white text-2xl font-semibold mb-4">
          Permissions
        </Text>
        <View className="gap-y-4 mb-12">
          {Object.entries(pluginInfo.permissions).map((x) => (
            <View key={x[0]} className="flex mt-1">
              {x[1].required && (
                <Text className="text-red-500 mr-4">Required</Text>
              )}
              <View>
                <Text className="text-foreground font-bold">
                  {x[0].replaceAll("socigy.", "")}
                </Text>
                <Text className="text-foreground/85">{x[1].description}</Text>
              </View>
              <Text className="text-foreground/60 italic">
                | {PermissionDescriptions[x[0] as never]}
              </Text>
            </View>
          ))}
        </View>

        {isInstalled && (
          <>
            {/* Components Section */}
            <Text className="text-white text-2xl font-semibold mb-4">
              Registered Components
            </Text>
            <View>
              <Text className="text-foreground">
                {uiRegistry
                  .getRegisteredComponentsForPlugin(localId)
                  ?.join(", ")}
              </Text>
            </View>
          </>
        )}
      </View>
    </AppBackgroundBase>
  );
}
