import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  UserCircle,
  CircleType,
  EditCircleDetailsRequest,
  RelationshipAPI,
} from "@/lib/api/RelationshipHelper";
import { Guid } from "@/lib/structures/Guid";
import EditCircleModal from "@/components/circles/modals/EditCircleModal";

interface CircleCardProps {
  circle: UserCircle;
  onDelete: (id: Guid) => void;
}

export default function CircleCard({ circle, onDelete }: CircleCardProps) {
  const router = useRouter();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const getCircleIcon = () => {
    let iconName: string;
    let iconColor: string;

    switch (circle.type) {
      case CircleType.Friends:
        iconName = "people";
        iconColor = "#3B82F6"; // blue-500
        break;
      case CircleType.Followers:
        iconName = "person";
        iconColor = "#10B981"; // green-500
        break;
      case CircleType.Following:
        iconName = "person";
        iconColor = "#8B5CF6"; // purple-500
        break;
      case CircleType.Subscribers:
        iconName = "person";
        iconColor = "#F59E0B"; // yellow-500
        break;
      case CircleType.Subscriptions:
        iconName = "person";
        iconColor = "#F97316"; // orange-500
        break;
      case CircleType.SharedGroup:
        iconName = "people";
        iconColor = "#EF4444"; // red-500
        break;
      default:
        iconName = "people";
        iconColor = "#6B7280"; // gray-500
    }

    return <Ionicons name={iconName as any} size={32} color={iconColor} />;
  };

  const handleCircleEdit = async (details: EditCircleDetailsRequest) => {
    const response = await RelationshipAPI.editCircle(circle.id, details);
    if (response.error) throw new Error(response.error.message);

    setShowEdit(false);
    if (details.name) circle.name = details.name;
    if (details.isDefault) circle.isDefault = details.isDefault;
  };

  const getCircleTypeName = () => {
    return CircleType[circle.type];
  };

  const handleViewDetails = () => {
    router.push(`/app/circles/${circle.id}`);
  };

  const confirmDelete = () => {
    setIsConfirmingDelete(true);
  };

  const cancelDelete = () => {
    setIsConfirmingDelete(false);
  };

  const handleDelete = () => {
    onDelete(circle.id);
  };

  return (
    <TouchableOpacity
      onPress={handleViewDetails}
      className="bg-white rounded-xl shadow-md p-6 border border-gray-100 mb-4"
    >
      {showEdit && (
        <EditCircleModal
          circle={circle}
          visible={showEdit}
          onClose={() => setShowEdit(false)}
          onEdit={handleCircleEdit}
        />
      )}
      <View className="flex-row justify-between items-start mb-4">
        <View className="flex-row items-center">
          {getCircleIcon()}
          <View className="ml-3">
            <Text className="text-lg font-semibold text-gray-800">
              {circle.name}
            </Text>
            <Text className="text-sm text-gray-500">{getCircleTypeName()}</Text>
          </View>
        </View>
        <View className="flex-row">
          <TouchableOpacity
            onPress={() => setShowEdit(true)}
            className="p-1.5 mr-2"
          >
            <Ionicons name="pencil" size={20} color="#6B7280" />
          </TouchableOpacity>
          {!circle.isDefault && (
            <>
              {!isConfirmingDelete ? (
                <TouchableOpacity
                  onPress={confirmDelete}
                  className="p-1.5"
                  disabled={circle.isDefault}
                >
                  <Ionicons name="trash" size={20} color="#6B7280" />
                </TouchableOpacity>
              ) : (
                <View className="flex-row">
                  <TouchableOpacity
                    onPress={cancelDelete}
                    className="p-1.5 mr-2"
                  >
                    <Text className="text-gray-500">Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleDelete}
                    className="p-1.5 bg-red-600 rounded-full"
                  >
                    <Text className="text-white">Delete</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </View>
      </View>

      {circle.isDefault && (
        <View className="bg-blue-100 rounded-full px-2.5 py-0.5 self-start">
          <Text className="text-xs font-medium text-blue-800">Default</Text>
        </View>
      )}

      <Text className="mt-4 text-sm text-gray-600">
        Created:{" "}
        {circle.createdAt
          ? new Date(circle.createdAt).toLocaleDateString()
          : "N/A"}
      </Text>
    </TouchableOpacity>
  );
}
