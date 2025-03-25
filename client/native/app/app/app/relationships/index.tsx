import { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import {
  RelationshipAPI,
  UserJoinedRelationship,
  RelationshipType,
  RelationshipStatus,
  RelationshipDetailsRequest,
} from "@/lib/api/RelationshipHelper";
import { RelationshipCard } from "@/components/relationships/RelationshipCard";
import RelationshipTypeSelector from "@/components/relationships/RelationshipTypeSelector";
import SendRelationshipModal from "@/components/relationships/modals/SendRelationshipsModal";
import type { Guid } from "@/lib/structures/Guid";

export default function RelationshipsPage() {
  const [relationships, setRelationships] = useState<UserJoinedRelationship[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<RelationshipType>(
    RelationshipType.Following
  );
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);

  useEffect(() => {
    loadRelationships();
  }, [selectedType]);

  const loadRelationships = async () => {
    setIsLoading(true);
    const response = await RelationshipAPI.listRelationships(
      selectedType,
      50,
      0
    );
    if (response.result) {
      setRelationships(response.result);
    }
    setIsLoading(false);
  };

  const handleSendRelationship = async (
    request: RelationshipDetailsRequest
  ) => {
    await RelationshipAPI.sendRelationship(request);
    setIsSendModalOpen(false);
    loadRelationships();
  };

  const handleRemoveRelationship = async (targetUserId: Guid) => {
    const request: RelationshipDetailsRequest = {
      targetUser: targetUserId,
      type: selectedType,
      status: RelationshipStatus.Remove,
    };
    await RelationshipAPI.setRelationshipStatus(request);
    loadRelationships();
  };

  const handleAcceptRelationship = async (targetUserId: Guid) => {
    const request: RelationshipDetailsRequest = {
      targetUser: targetUserId,
      type: selectedType,
      status: RelationshipStatus.Accepted,
    };
    await RelationshipAPI.setRelationshipStatus(request);
    loadRelationships();
  };

  const handleRejectRelationship = async (targetUserId: Guid) => {
    const request: RelationshipDetailsRequest = {
      targetUser: targetUserId,
      type: selectedType,
      status: RelationshipStatus.Rejected,
    };
    await RelationshipAPI.setRelationshipStatus(request);
    loadRelationships();
  };

  const handleBlockUser = async (targetUserId: Guid) => {
    await RelationshipAPI.blockUser(targetUserId);
    loadRelationships();
  };

  const handleUnblockUser = async (targetUserId: Guid) => {
    await RelationshipAPI.unblockUser(targetUserId);
    loadRelationships();
  };

  return (
    <View className="flex-1 p-4 bg-gray-50">
      <View className="flex-row justify-between items-center mb-6">
        <Text className="text-3xl font-bold text-gray-800">
          My Relationships
        </Text>
        <Pressable
          onPress={() => setIsSendModalOpen(true)}
          className="flex-row items-center gap-2 bg-indigo-600 py-2 px-4 rounded-lg active:bg-indigo-700"
        >
          <Feather name="plus" size={20} color="white" />
          <Text className="text-white font-medium">Connect with User</Text>
        </Pressable>
      </View>

      <RelationshipTypeSelector
        selectedType={selectedType}
        onSelectType={setSelectedType}
      />

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : relationships.length > 0 ? (
        <FlatList
          data={relationships}
          keyExtractor={(item) => item.targetId}
          numColumns={3}
          columnWrapperStyle={{ gap: 16 }}
          contentContainerStyle={{ gap: 16 }}
          renderItem={({ item }) => (
            <RelationshipCard
              relationship={item}
              onRemove={handleRemoveRelationship}
              onAccept={handleAcceptRelationship}
              onReject={handleRejectRelationship}
              onBlock={handleBlockUser}
              onUnblock={handleUnblockUser}
            />
          )}
        />
      ) : (
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-500">
            No {RelationshipType[selectedType].toLowerCase()} relationships
            found.
          </Text>
        </View>
      )}

      <SendRelationshipModal
        visible={isSendModalOpen}
        onClose={() => setIsSendModalOpen(false)}
        onSend={handleSendRelationship}
      />
    </View>
  );
}
