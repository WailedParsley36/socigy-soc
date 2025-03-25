import React, { useState } from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  RelationshipType,
  RelationshipStatus,
} from "@/lib/api/RelationshipHelper";

interface RelationshipActionsProps {
  relationshipType: RelationshipType;
  relationshipStatus: RelationshipStatus;
  onRemove: () => void;
  onBlock: () => void;
  onUnblock: () => void;
}

export default function RelationshipActions({
  relationshipType,
  relationshipStatus,
  onRemove,
  onBlock,
  onUnblock,
}: RelationshipActionsProps) {
  const [isConfirmingRemove, setIsConfirmingRemove] = useState(false);
  const [isConfirmingBlock, setIsConfirmingBlock] = useState(false);

  const getActionText = () => {
    switch (relationshipType) {
      case RelationshipType.Blocked:
        return "Unblock";
      case RelationshipType.Following:
        return "Unfollow";
      case RelationshipType.Follower:
        return "Remove Follower";
      case RelationshipType.Friend:
        return relationshipStatus === RelationshipStatus.Rejected
          ? "Forget"
          : "Unfriend";
      case RelationshipType.Subscriber:
        return "Remove Subscriber";
      case RelationshipType.Subscription:
        return "Unsubscribe";
      default:
        return "Remove";
    }
  };

  return (
    <View className="flex-row justify-between mt-4">
      {relationshipType !== RelationshipType.Blocked && (
        <View>
          {!isConfirmingBlock ? (
            <TouchableOpacity
              onPress={() => setIsConfirmingBlock(true)}
              className="flex-row items-center gap-1"
            >
              <Ionicons name="ban" size={16} color="#4B5563" />
              <Text className="text-sm text-gray-600">Block</Text>
            </TouchableOpacity>
          ) : (
            <View className="flex-row gap-2">
              <TouchableOpacity onPress={() => setIsConfirmingBlock(false)}>
                <Text className="text-sm text-gray-600">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  onBlock();
                  setIsConfirmingBlock(false);
                }}
              >
                <Text className="text-sm text-red-600 font-medium">
                  Confirm Block
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      <View>
        {!isConfirmingRemove ? (
          <TouchableOpacity
            onPress={() => setIsConfirmingRemove(true)}
            className="flex-row items-center gap-1"
          >
            {relationshipType === RelationshipType.Blocked ? (
              <>
                <Ionicons name="ban" size={16} color="#4B5563" />
                <Text className="text-sm text-gray-600">{getActionText()}</Text>
              </>
            ) : (
              <>
                {relationshipStatus === RelationshipStatus.Rejected ? (
                  <Ionicons name="close" size={16} color="#4B5563" />
                ) : (
                  <Ionicons name="person-remove" size={16} color="#4B5563" />
                )}
                <Text className="text-sm text-gray-600">{getActionText()}</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <View className="flex-row gap-2">
            <TouchableOpacity onPress={() => setIsConfirmingRemove(false)}>
              <Text className="text-sm text-gray-600">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                if (relationshipType === RelationshipType.Blocked) {
                  onUnblock();
                } else {
                  onRemove();
                }
                setIsConfirmingRemove(false);
              }}
            >
              <Text className="text-sm text-red-600 font-medium">Confirm</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}
