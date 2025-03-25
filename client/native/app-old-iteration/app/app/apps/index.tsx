import { PluginTile } from "@/components/apps/plugins/PluginTile";
import AppBackgroundBase from "@/components/background/AppBackgroundBase";
import PluginPermissionModal from "@/components/modals/PluginPermissionModal";
import { Colors, Theme } from "@/constants/Colors";
import { Plugin } from "@/data/plugins/Plugin";
import {
  usePluginManager,
  usePlugins,
  useUiRegistry,
} from "@/managers/Exports";
import { PluginManagerType } from "@/managers/plugins/Exports";
import Feather from "@expo/vector-icons/Feather";
import clsx from "clsx";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";
import { TextInput } from "react-native-gesture-handler";

const packages: Plugin[] = [
  {
    id: "1234",
    name: "Rust Example Plugin",
    version: "1.0.0",
    apiVersion: "^1.0.0",

    language: "rust",
    systems: ["android", "windows", "linux"],
    platforms: ["mobile", "desktop"],

    authors: [
      {
        username: "Socigy",
        tag: "0000",
      },
    ],

    description:
      "This is an example plugin using the Socigy Plugin - Rust UI kit",

    permissions: {
      "socigy.ui.components.replace": {
        description: "Required to change your profile page appearance",
        link: "https://dev.socigy.com/docs/permissions/ui/components/replace",
        required: true,
        componentIds: [
          "81fada10-0924-4f60-bfe8-51c0ac228297",
          "f74be237-f439-4ef0-85a8-a773db41e8bd",
        ],
      },
    },
  },
];

export default function Apps() {
  // Hooks
  const plugins = usePluginManager();

  // States
  const [showLibrary, setShowLibrary] = useState(false);

  return (
    <AppBackgroundBase className="flex-1 p-10">
      <View className="flex-row justify-between px-10 border-b border-level-2 pb-6">
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => setShowLibrary(false)}
        >
          <Text
            className={clsx(
              showLibrary ? "text-level-5" : "text-foreground",
              "text-3xl"
            )}
          >
            Explore
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => setShowLibrary(true)}
        >
          <Text
            className={clsx(
              showLibrary ? "text-foreground" : "text-level-5",
              "text-3xl"
            )}
          >
            Library
          </Text>
        </TouchableOpacity>
      </View>
      {showLibrary ? (
        <Library plugins={plugins} />
      ) : (
        <Explore plugins={plugins} />
      )}
    </AppBackgroundBase>
  );
}

interface ExploreProps {
  plugins: PluginManagerType;
}

function Explore({ plugins }: ExploreProps) {
  // States
  const [query, setQuery] = useState<string>();
  const [queryResult, setQueryResults] = useState<Plugin[]>([]);

  // Callbacks
  const handleSearchChange = useCallback((text: string) => {
    setQuery(text);
  }, []);

  const handleBrowseEndReached = useCallback(
    async (event: any, replace?: boolean) => {
      const found = await plugins.queryPlugins(query, 10, queryResult.length);
      if (replace) {
        setQueryResults(found);
        return;
      }

      setQueryResults((prev) => [...prev, ...found]);
    },
    [plugins, query, queryResult]
  );

  // Effects
  useFocusEffect(
    useCallback(() => {
      setQueryResults((prev) => [...prev]);
    }, [plugins])
  );
  useEffect(() => {
    handleBrowseEndReached(undefined, true);
  }, [query]);

  return (
    <View className="pt-8">
      <View className="border border-level-4 py-3 justify-center px-5 rounded-md">
        <Feather
          name="search"
          size={20}
          color={Colors[Theme]["bg-light"]}
          className="absolute left-3"
        />
        <TextInput
          className={clsx("text-foreground", "font-inter-regular")}
          onChangeText={handleSearchChange}
          style={{ paddingLeft: 24 }}
          placeholderTextColor={Colors[Theme]["text-third"]}
          placeholder="Find the perfect one..."
        />
      </View>
      <FlatList
        className="mt-4"
        data={queryResult}
        onEndReached={handleBrowseEndReached as never}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isInstalled = plugins.isInstalled(item.id);

          return (
            <PluginTile
              plugin={item}
              installed={isInstalled}
              onActionButtonPress={() => {
                if (isInstalled) {
                  plugins.uninstallPluginAsync(item.id).then((res) => {
                    setQueryResults((prev) => [...prev]);
                  });
                } else
                  router.push(`/app/apps/detail/permissions?id=${item.id}`);
              }}
              onPluginPress={() => {
                router.push(`/app/apps/detail?id=${item.id}`);
              }}
            />
          );
        }}
      />
    </View>
  );
}

function Library({ plugins }: ExploreProps) {
  // States
  const [installed, setInstalled] = useState<Plugin[]>([]);

  // Callbacks
  const handleBrowseEndReached = useCallback(
    async (e: any, replace: boolean) => {
      const result = await plugins.getInstalledPlugins(10, installed.length);
      if (!result.result) return;

      if (replace) setInstalled([...result.result]);
      else setInstalled((prev) => [...prev, ...result.result!]);
    },
    [installed]
  );

  // Effecs
  useFocusEffect(
    useCallback(() => {
      handleBrowseEndReached(undefined, true);
    }, [])
  );

  return (
    <View className="flex-1">
      {installed.length == 0 ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-level-5">You've not installed any plugin</Text>
        </View>
      ) : (
        <FlatList
          className="mt-4"
          data={installed}
          onEndReached={handleBrowseEndReached as never}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const isInstalled = plugins.isInstalled(item.id);

            return (
              <PluginTile
                plugin={item}
                installed={isInstalled}
                onActionButtonPress={() => {
                  if (isInstalled) {
                    plugins.uninstallPluginAsync(item.id).then((res) => {
                      setInstalled((prev) =>
                        prev.filter((x) => x.id != item.id)
                      );
                    });
                  } else
                    router.push(`/app/apps/detail/permissions?id=${item.id}`);
                }}
                onPluginPress={() => {
                  router.push(`/app/apps/detail?id=${item.id}`);
                }}
              />
            );
          }}
        />
      )}
    </View>
  );
}
