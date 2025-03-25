import { usePluginManager } from "@/managers/Exports";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect } from "react";
import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Plugin } from "@/data/plugins/Plugin";
import AppBackgroundBase from "@/components/background/AppBackgroundBase";
import { PermissionDescriptions } from ".";

interface PermissionItemProps {
  title: string;
  description: string;
  checked?: boolean;
  required: boolean;

  setChecked: (checked: boolean) => void;
}

function PermissionItem({
  title,
  description,
  setChecked,
  required,
  checked,
}: PermissionItemProps) {
  return (
    <TouchableOpacity
      disabled={required}
      className="flex-row items-center py-4"
    >
      {!required && (
        <Switch value={checked} onValueChange={() => setChecked(!checked)} />
      )}
      <View>
        {required && <Text className="text-red-500">(required) </Text>}
        <Text className="text-white text-lg font-medium">{title}</Text>
        <Text className="text-white/70 text-base">{description}</Text>
      </View>
    </TouchableOpacity>
  );
}

const SectionTitle = ({ title }: { title: string }) => (
  <Text className="text-white text-2xl font-medium mb-2">{title}</Text>
);

function NoPluginFound({ id }: any) {
  return (
    <View className="flex-1 items-center justify-center">
      <Text className="text-white text-2xl">
        Plugin with id {id} was not found
      </Text>
    </View>
  );
}

export default function PermissionsScreen() {
  // Hooks
  const { id } = useLocalSearchParams();
  const localId = typeof id === "string" ? id : id[0];

  const plugins = usePluginManager();

  // States
  const [pluginInfo, setPluginInfo] = useState<Plugin | null>();
  const [allowed, setAllowed] = useState<{ [id: string]: boolean }>({});

  // Effects
  useEffect(() => {
    // TODO: This should be saved in a context and passed around
    plugins.getPluginAsync(localId).then((result) => {
      if (result.error) {
        setPluginInfo(undefined);
        return;
      }

      setPluginInfo(result.result as Plugin | null | undefined);
    });
  }, [id]);

  // Callbacks
  const handleCancel = () => {
    if (router.canGoBack()) router.back();
    else router.replace(`/app/apps/detail?id=${localId}`);
  };

  const handleAllow = async () => {
    // TODO: Send permissions to server
    // TODO: SEC - Handle permissions and pass it down to the Socigy Wasm
    try {
      await plugins.installPluginAsync(pluginInfo!);
    } catch (e) {
      console.error(e.toString());
      Alert.alert(e.toString());
    }

    if (router.canGoBack()) router.back();
    else router.replace(`/app/apps/detail?id=${localId}`);
  };

  if (pluginInfo == undefined) return <NoPluginFound id={localId} />;

  return (
    <AppBackgroundBase className="flex-1">
      <ScrollView className="flex-1 px-6">
        <View className="py-8">
          <Text className="text-white text-4xl font-bold mb-2">
            {pluginInfo?.name}
          </Text>
          <Text className="text-white text-4xl font-light mb-8">
            is asking for following permissions
          </Text>
          <SectionTitle title="User Interface (required)" />
          {Object.entries(pluginInfo.permissions).map((x) => (
            <PermissionItem
              key={x[0]}
              setChecked={(checked) =>
                setAllowed((prev) => ({ ...prev, [x[0]]: checked }))
              }
              title={x[0]}
              required={x[1].required}
              description={PermissionDescriptions[x[0] as never]}
              checked={allowed[x[0]]}
            />
          ))}
        </View>
      </ScrollView>

      <View className="px-6 py-4 flex-row gap-4">
        <TouchableOpacity
          className="flex-1 py-4 rounded-full bg-[#1C1C1E]"
          activeOpacity={0.7}
          onPress={handleCancel}
        >
          <Text className="text-white text-center text-lg font-semibold">
            Cancel
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-1 py-4 rounded-full bg-[#3A3A3C]"
          activeOpacity={0.7}
          onPress={handleAllow}
        >
          <Text className="text-white text-center text-lg font-semibold">
            Allow
          </Text>
        </TouchableOpacity>
      </View>
    </AppBackgroundBase>
  );
}
