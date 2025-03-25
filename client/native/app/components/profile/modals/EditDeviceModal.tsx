import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  Modal,
} from "react-native";
import { Device } from "@/lib/api/ProfileHelper";

interface EditDeviceModalProps {
  device: Device;
  visible: boolean;
  onClose: () => void;
  onSave: (
    deviceId: number,
    deviceName: string,
    isTrusted: boolean,
    isBlocked: boolean
  ) => void;
}

export default function EditDeviceModal({
  device,
  visible,
  onClose,
  onSave,
}: EditDeviceModalProps) {
  const [deviceName, setDeviceName] = useState(device.deviceName);
  const [isTrusted, setIsTrusted] = useState(device.isTrusted);
  const [isBlocked, setIsBlocked] = useState(device.isBlocked);

  useEffect(() => {
    setDeviceName(device.deviceName);
    setIsTrusted(device.isTrusted);
    setIsBlocked(device.isBlocked);
  }, [device]);

  const handleSubmit = () => {
    onSave(device.id, deviceName, isTrusted, isBlocked);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black bg-opacity-50 justify-center items-center">
        <View className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md m-4">
          <Text className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Edit Device
          </Text>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Device Name
            </Text>
            <TextInput
              value={deviceName}
              onChangeText={setDeviceName}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
            />
          </View>

          <View className="mb-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-gray-700 dark:text-gray-300">
                Trust this device
              </Text>
              <Switch
                value={isTrusted}
                onValueChange={setIsTrusted}
                trackColor={{ false: "#767577", true: "#81b0ff" }}
                thumbColor={isTrusted ? "#f5dd4b" : "#f4f3f4"}
              />
            </View>
            <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Trusted devices may bypass certain security checks.
            </Text>
          </View>

          <View className="mb-6">
            <View className="flex-row items-center justify-between">
              <Text className="text-gray-700 dark:text-gray-300">
                Block this device
              </Text>
              <Switch
                value={isBlocked}
                onValueChange={setIsBlocked}
                trackColor={{ false: "#767577", true: "#ff8181" }}
                thumbColor={isBlocked ? "#f5dd4b" : "#f4f3f4"}
              />
            </View>
            <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Blocked devices cannot be used to access your account.
            </Text>
          </View>

          <View className="flex-row justify-end space-x-3">
            <TouchableOpacity
              onPress={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
            >
              <Text className="text-gray-700 dark:text-gray-300">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit}
              className="px-4 py-2 bg-indigo-800 rounded-md"
            >
              <Text className="text-white">Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
