import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Switch,
  ActivityIndicator,
} from "react-native";
import {
  UserCircle,
  EditCircleDetailsRequest,
} from "@/lib/api/RelationshipHelper";

interface EditCircleModalProps {
  circle: UserCircle;
  visible: boolean;
  onClose: () => void;
  onEdit: (details: EditCircleDetailsRequest) => Promise<void>;
}

export default function EditCircleModal({
  circle,
  visible,
  onClose,
  onEdit,
}: EditCircleModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [circleName, setCircleName] = useState(circle.name);
  const [isDefault, setIsDefault] = useState(circle.isDefault);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      await onEdit({
        name: circleName,
        isDefault: isDefault,
      });
    } catch (err) {
      setError("Failed to update circle. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        className="flex-1 bg-black/50 justify-center items-center"
        activeOpacity={1}
        onPressOut={onClose}
      >
        <View className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md m-4">
          <Text className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Edit Circle
          </Text>

          {error && (
            <View className="mb-4 p-3 bg-red-100 border-l-4 border-red-500 rounded">
              <Text className="text-red-700">{error}</Text>
            </View>
          )}

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Circle Name
            </Text>
            <TextInput
              value={circleName}
              onChangeText={setCircleName}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
              placeholder="Circle name"
              editable={!isSubmitting}
            />
          </View>

          <View className="mb-6">
            <View className="flex-row items-center justify-between">
              <Text className="text-gray-700 dark:text-gray-300">
                Set as default circle
              </Text>
              <Switch
                value={isDefault}
                onValueChange={setIsDefault}
                trackColor={{ false: "#767577", true: "#818cf8" }}
                thumbColor={isDefault ? "#e5e7eb" : "#f4f3f4"}
                disabled={isSubmitting}
              />
            </View>
            <Text className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Note: If this is already a default circle for its type, you cannot
              uncheck this option unless another circle of the same type is set
              as default.
            </Text>
          </View>

          <View className="flex-row justify-end space-x-3">
            <TouchableOpacity
              onPress={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
              disabled={isSubmitting}
            >
              <Text className="text-gray-700 dark:text-gray-300">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit}
              className="px-4 py-2 bg-indigo-600 rounded-md"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white">Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
