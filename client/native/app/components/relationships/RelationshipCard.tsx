import { useState } from "react";
import { View, Text, Image, Pressable } from "react-native";
import {
  MaterialCommunityIcons as Icons,
  MaterialIcons,
} from "@expo/vector-icons";
import {
  UserJoinedRelationship,
  RelationshipStatus,
  RelationshipType,
} from "@/lib/api/RelationshipHelper";
import { Guid } from "@/lib/structures/Guid";
import RelationshipActions from "./RelationshipActions";

interface RelationshipCardProps {
  relationship: UserJoinedRelationship;
  onRemove: (targetUserId: Guid) => void;
  onAccept: (targetUserId: Guid) => void;
  onReject: (targetUserId: Guid) => void;
  onBlock: (targetUserId: Guid) => void;
  onUnblock: (targetUserId: Guid) => void;
}

export function RelationshipCard({
  relationship,
  onRemove,
  onAccept,
  onReject,
  onBlock,
  onUnblock,
}: RelationshipCardProps) {
  const [isConfirmingBlock, setIsConfirmingBlock] = useState(false);

  const getStatusBadge = () => {
    const baseStyle = "px-2 py-1 rounded-full text-xs font-medium";
    switch (relationship.computedStatus) {
      case RelationshipStatus.Pending:
      case RelationshipStatus.Received:
        return (
          <Text className={`${baseStyle} bg-yellow-100 text-yellow-800`}>
            Pending
          </Text>
        );
      case RelationshipStatus.Accepted:
        return (
          <Text className={`${baseStyle} bg-green-100 text-green-800`}>
            Connected
          </Text>
        );
      case RelationshipStatus.Rejected:
        return (
          <Text className={`${baseStyle} bg-gray-100 text-gray-800`}>
            Rejected
          </Text>
        );
      case RelationshipStatus.Blocked:
        return (
          <Text className={`${baseStyle} bg-red-100 text-red-800`}>
            Blocked
          </Text>
        );
      default:
        return null;
    }
  };

  return (
    <View className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-200">
      <View className="flex-row justify-between items-start">
        <View className="flex-row items-center flex-1">
          {relationship.targetIconUrl ? (
            <Image
              source={{ uri: relationship.targetIconUrl }}
              className="h-12 w-12 rounded-full mr-3"
              accessibilityLabel={relationship.targetUsername}
            />
          ) : (
            <View className="h-12 w-12 rounded-full bg-gray-200 items-center justify-center mr-3">
              <Icons name="account" size={24} color="#6b7280" />
            </View>
          )}

          <View className="flex-1">
            <Text className="text-lg font-semibold text-gray-800">
              {relationship.targetUsername}
              <Text className="text-gray-500 text-sm ml-1">
                #{relationship.targetTag}
              </Text>
            </Text>

            <View className="flex-row items-center mt-1">
              {getStatusBadge()}
              <Text className="ml-2 text-sm text-gray-500">
                {RelationshipType[relationship.type]}
              </Text>
            </View>
          </View>
        </View>

        {isConfirmingBlock && (
          <View className="flex-row gap-1">
            <Pressable
              onPress={() => setIsConfirmingBlock(false)}
              className="p-1 rounded active:opacity-75"
            >
              <Text className="text-xs text-gray-500">Cancel</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                onBlock(relationship.targetId);
                setIsConfirmingBlock(false);
              }}
              className="p-1 rounded active:opacity-75 bg-red-600"
            >
              <Text className="text-xs text-white">Block</Text>
            </Pressable>
          </View>
        )}
      </View>

      <View className="mt-2">
        {relationship.requestedAt && (
          <Text className="text-sm text-gray-600">
            Requested: {new Date(relationship.requestedAt).toLocaleDateString()}
          </Text>
        )}
        {relationship.acceptedAt && (
          <Text className="text-sm text-gray-600">
            Connected: {new Date(relationship.acceptedAt).toLocaleDateString()}
          </Text>
        )}
      </View>

      {relationship.status === RelationshipStatus.Pending ||
      relationship.status === RelationshipStatus.Received ? (
        <View className="flex-row justify-between mt-4">
          {relationship.status === RelationshipStatus.Received && (
            <Pressable
              onPress={() => onAccept(relationship.targetId)}
              className="flex-row items-center gap-1 active:opacity-75"
            >
              <Icons name="check" size={16} color="#16a34a" />
              <Text className="text-sm text-green-600">Accept</Text>
            </Pressable>
          )}
          <Pressable
            onPress={() =>
              relationship.status === RelationshipStatus.Pending
                ? onRemove(relationship.targetId)
                : onReject(relationship.targetId)
            }
            className="flex-row items-center gap-1 active:opacity-75"
          >
            <MaterialIcons name="close" size={16} color="#4b5563" />
            <Text className="text-sm text-gray-600">
              {relationship.computedStatus === RelationshipStatus.Pending
                ? "Unsend"
                : relationship.computedStatus === RelationshipStatus.Rejected
                ? "Forget"
                : "Reject"}
            </Text>
          </Pressable>
        </View>
      ) : (
        <RelationshipActions
          relationshipType={relationship.type}
          relationshipStatus={
            relationship.status > relationship.targetStatus
              ? relationship.status
              : relationship.targetStatus
          }
          onRemove={() => onRemove(relationship.targetId)}
          onBlock={() => onBlock(relationship.targetId)}
          onUnblock={() => onUnblock(relationship.targetId)}
        />
      )}
    </View>
  );
}
