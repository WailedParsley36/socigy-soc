import React, { useState } from "react";
import { View, Text, ScrollView, Switch, Modal, Pressable } from "react-native";

const permissions = {
  "socigy.ui.components.replace": {
    description: "Required to change your profile page appearance",
    link: "https://dev.socigy.com/docs/permissions/ui/components/replace",
    required: true,
  },
  "socigy.ui.components.delete": {
    description: "Allows deleting components",
    link: "https://dev.socigy.com/docs/permissions/ui/components/delete",
    required: true,
  },
};

const buildPermissionTree = (permissions: Record<string, any>) => {
  const tree: any = {};

  Object.keys(permissions).forEach((key) => {
    const parts = key.split(".");
    let node = tree;
    for (const part of parts) {
      if (!node[part]) node[part] = {};
      node = node[part];
    }
    node._info = permissions[key];
  });

  return tree;
};

const PermissionItem = ({ path, node, toggles, setToggles }: any) => {
  const [expanded, setExpanded] = useState(true);
  const togglePath = path.join(".");

  return (
    <View className="ml-4">
      <Pressable onPress={() => setExpanded(!expanded)}>
        <Text className="text-lg font-bold">{path[path.length - 1]}</Text>
      </Pressable>

      {node._info && (
        <View className="flex-row items-center mt-1">
          <Switch
            value={toggles[togglePath]}
            onValueChange={(val) =>
              setToggles((prev: any) => ({ ...prev, [togglePath]: val }))
            }
          />
          <Text className="ml-2">{node._info.description}</Text>
        </View>
      )}

      {expanded &&
        Object.keys(node)
          .filter((key) => key !== "_info")
          .map((key) => (
            <PermissionItem
              key={key}
              path={[...path, key]}
              node={node[key]}
              toggles={toggles}
              setToggles={setToggles}
            />
          ))}
    </View>
  );
};

const PermissionModal = ({ visible, onClose, onCancel }: any) => {
  const [toggles, setToggles] = useState<{ [key: string]: boolean }>({});
  const permissionTree = buildPermissionTree(permissions);

  const handleAllowAll = (e: any) => {
    setToggles((prev) => {
      Object.keys(prev).forEach((x) => {
        prev[x] = true;
      });
      return prev;
    });

    onClose(e);
  };

  return (
    <Modal visible={visible} transparent>
      <View className="flex-1 justify-center items-center bg-black/50">
        <View className="bg-white p-5 rounded-lg w-4/5">
          <Text className="text-xl font-bold">Requesting Permissions</Text>
          <ScrollView className="mt-4">
            {Object.keys(permissionTree).map((key) => (
              <PermissionItem
                key={key}
                path={[key]}
                node={permissionTree[key]}
                toggles={toggles}
                setToggles={setToggles}
              />
            ))}
          </ScrollView>

          <View className="">
            <Pressable
              className="bg-blue-500 p-2 rounded-lg mt-4"
              onPress={handleAllowAll}
            >
              <Text className="text-white text-center">Allow All</Text>
            </Pressable>
            <Pressable
              className="bg-blue-500 p-2 rounded-lg mt-4"
              onPress={onClose}
            >
              <Text className="text-white text-center">Allow</Text>
            </Pressable>
            <Pressable
              className="bg-red-500 p-2 rounded-lg mt-4"
              onPress={onCancel}
            >
              <Text className="text-white text-center">Cancel</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default PermissionModal;
