import React from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RelationshipType } from "@/lib/api/RelationshipHelper";

interface RelationshipTypeSelectorProps {
  selectedType: RelationshipType;
  onSelectType: (type: RelationshipType) => void;
}

export default function RelationshipTypeSelector({
  selectedType,
  onSelectType,
}: RelationshipTypeSelectorProps) {
  const getButtonStyle = (type: RelationshipType) => {
    const baseStyle = "flex-row items-center gap-2 py-3 px-4";
    let activeStyle = "";

    switch (type) {
      case RelationshipType.Following:
        activeStyle =
          selectedType === type
            ? "border-b-2 border-indigo-600 text-indigo-600 font-semibold"
            : "text-gray-500";
        break;
      case RelationshipType.Follower:
        activeStyle =
          selectedType === type
            ? "border-b-2 border-indigo-600 text-indigo-600 font-semibold"
            : "text-gray-500";
        break;
      case RelationshipType.Friend:
        activeStyle =
          selectedType === type
            ? "border-b-2 border-green-600 text-green-600 font-semibold"
            : "text-gray-500";
        break;
      case RelationshipType.Subscription:
        activeStyle =
          selectedType === type
            ? "border-b-2 border-yellow-600 text-yellow-600 font-semibold"
            : "text-gray-500";
        break;
      case RelationshipType.Subscriber:
        activeStyle =
          selectedType === type
            ? "border-b-2 border-yellow-600 text-yellow-600 font-semibold"
            : "text-gray-500";
        break;
      case RelationshipType.Blocked:
        activeStyle =
          selectedType === type
            ? "border-b-2 border-red-600 text-red-600 font-semibold"
            : "text-gray-500";
        break;
    }

    return `${baseStyle} ${activeStyle}`;
  };

  return (
    <View className="flex-row border-b border-gray-200 mb-6">
      <TouchableOpacity
        className={getButtonStyle(RelationshipType.Following)}
        onPress={() => onSelectType(RelationshipType.Following)}
      >
        <Ionicons name="person-outline" size={20} />
        <Text>Following</Text>
      </TouchableOpacity>

      <TouchableOpacity
        className={getButtonStyle(RelationshipType.Follower)}
        onPress={() => onSelectType(RelationshipType.Follower)}
      >
        <Ionicons name="people-outline" size={20} />
        <Text>Followers</Text>
      </TouchableOpacity>

      <TouchableOpacity
        className={getButtonStyle(RelationshipType.Friend)}
        onPress={() => onSelectType(RelationshipType.Friend)}
      >
        <Ionicons name="people-circle-outline" size={20} />
        <Text>Friends</Text>
      </TouchableOpacity>

      <TouchableOpacity
        className={getButtonStyle(RelationshipType.Subscription)}
        onPress={() => onSelectType(RelationshipType.Subscription)}
      >
        <Ionicons name="star-outline" size={20} />
        <Text>Subscriptions</Text>
      </TouchableOpacity>

      <TouchableOpacity
        className={getButtonStyle(RelationshipType.Subscriber)}
        onPress={() => onSelectType(RelationshipType.Subscriber)}
      >
        <Ionicons name="star-outline" size={20} />
        <Text>Subscribers</Text>
      </TouchableOpacity>

      <TouchableOpacity
        className={getButtonStyle(RelationshipType.Blocked)}
        onPress={() => onSelectType(RelationshipType.Blocked)}
      >
        <Ionicons name="close-outline" size={20} />
        <Text>Blocked</Text>
      </TouchableOpacity>
    </View>
  );
}
