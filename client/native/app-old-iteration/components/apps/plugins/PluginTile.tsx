import { Plugin } from "@/data/plugins/Plugin";
import { View, Text, TouchableOpacity } from "react-native";

export interface PluginTileProps {
  plugin: Plugin;
  installed: boolean;
  onActionButtonPress: () => void;
  onPluginPress: () => void;
}
export function PluginTile({
  plugin,
  installed,
  onPluginPress,
  onActionButtonPress,
}: PluginTileProps) {
  return (
    <TouchableOpacity
      onPress={onPluginPress}
      activeOpacity={0.9}
      className="bg-gray-800 p-6 m-2 rounded-lg shadow-md"
    >
      <Text className="text-gray-300">
        Author{plugin.authors.length > 1 ? "s" : ""}:{" "}
        {plugin.authors.map((x) => `${x.username}`).join(", ")}
      </Text>
      <Text className="text-lg font-bold text-white">{plugin.name}</Text>
      <Text className="text-gray-300">Version: {plugin.version}</Text>
      <Text className="text-gray-400 mt-2">{plugin.description}</Text>

      <TouchableOpacity
        className="bg-blue-500 p-2 mt-4 rounded-lg"
        onPress={onActionButtonPress}
      >
        <Text className="text-white text-center">
          {installed ? "Uninstall" : "Install"}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}
