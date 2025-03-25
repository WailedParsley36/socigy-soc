import React, { useState } from "react";
import { View, Text, TextInput, Pressable, Modal } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { Feather, Ionicons } from "@expo/vector-icons";
import {
  CircleType,
  EditCircleDetailsRequest,
} from "@/lib/api/RelationshipHelper";

interface CreateCircleModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (details: EditCircleDetailsRequest) => void;
}

export function CreateCircleModal({
  visible,
  onClose,
  onCreate,
}: CreateCircleModalProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<CircleType>(CircleType.Mixed);
  const [isDefault, setIsDefault] = useState(false);

  const handleSubmit = () => {
    onCreate({ name, type, isDefault });
    resetForm();
  };

  const resetForm = () => {
    setName("");
    setType(CircleType.Mixed);
    setIsDefault(false);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-center p-4">
        <View className="bg-white rounded-xl p-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold text-gray-800">
              Create New Circle
            </Text>
            <Pressable
              onPress={() => {
                resetForm();
                onClose();
              }}
              className="p-1"
            >
              <Ionicons name="close" size={24} color="#6b7280" />
            </Pressable>
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Circle Name
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Enter circle name"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Circle Type
            </Text>
            <View className="border border-gray-300 rounded-lg">
              <Picker
                selectedValue={type}
                onValueChange={(value) => setType(value)}
                style={{ color: "#1f2937" }}
              >
                {Object.keys(CircleType)
                  .filter((key) => isNaN(Number(key)))
                  .map((typeName, index) => (
                    <Picker.Item
                      key={typeName}
                      label={typeName}
                      value={index}
                    />
                  ))}
              </Picker>
            </View>
          </View>

          <Pressable
            onPress={() => setIsDefault(!isDefault)}
            className="flex-row items-center mb-6"
          >
            <View
              className={`w-4 h-4 border rounded-sm mr-2 
              ${
                isDefault
                  ? "bg-indigo-600 border-indigo-600"
                  : "border-gray-300"
              }`}
            >
              {isDefault && <Feather name="check" size={14} color="white" />}
            </View>
            <Text className="text-sm text-gray-700">
              Set as default circle for this type
            </Text>
          </Pressable>

          <View className="flex-row justify-end gap-3">
            <Pressable
              onPress={() => {
                resetForm();
                onClose();
              }}
              className="px-4 py-2 bg-gray-100 rounded-lg active:bg-gray-200"
            >
              <Text className="text-gray-700">Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleSubmit}
              className="px-4 py-2 bg-indigo-600 rounded-lg active:bg-indigo-700"
            >
              <Text className="text-white">Create Circle</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
