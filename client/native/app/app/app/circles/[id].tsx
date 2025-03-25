import { useState, useEffect } from "react";
import { View, Text, Pressable, ActivityIndicator, Modal } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { RelationshipAPI } from "@/lib/api/RelationshipHelper";
import MembersList from "@/components/circles/MemberList";
import { InvitationsList } from "@/components/circles/InvitationList";
import AddMembersModal from "@/components/circles/modals/AddMembersModal";
import { Feather, Ionicons } from "@expo/vector-icons";
import {
  CircleDetailsResponse,
  CircleMemberBatchDetails,
  CircleMemberRole,
  CircleType,
} from "@/lib/api/RelationshipHelper";
import { Guid } from "@/lib/structures/Guid";
import { SafeAreaView } from "react-native-safe-area-context";
import LoadingScreen from "@/components/LoadingScreen";

export default function CircleDetailPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const id = params.id as Guid;

  const [circleDetails, setCircleDetails] =
    useState<CircleDetailsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"members" | "invitations">(
    "members"
  );
  const [isAddMembersModalOpen, setIsAddMembersModalOpen] = useState(false);

  useEffect(() => {
    if (id) {
      loadCircleDetails();
    }
  }, [id]);

  const loadCircleDetails = async () => {
    setIsLoading(true);
    const response = await RelationshipAPI.getCircleDetails(id);
    if (response.result) {
      setCircleDetails(response.result);
    }
    setIsLoading(false);
  };

  const handleAddMembers = async (members: CircleMemberBatchDetails[]) => {
    if (!id) return;

    await RelationshipAPI.addCircleMembers(id as Guid, members);
    setIsAddMembersModalOpen(false);
    loadCircleDetails();
  };

  const handleRemoveMember = async (userId: Guid) => {
    if (!id) return;

    await RelationshipAPI.removeCircleMembers(id as Guid, [{ id: userId }]);
    loadCircleDetails();
  };

  const handleEditMember = async (member: CircleMemberBatchDetails) => {
    if (!id) return;

    await RelationshipAPI.editCircleMembers(id as Guid, [member]);
    loadCircleDetails();
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!circleDetails?.info) {
    return (
      <View className="flex-1 items-center justify-center p-4">
        <Text className="text-2xl font-bold text-gray-800 mb-4">
          Circle not found
        </Text>
        <Pressable
          onPress={() => router.push("/app/circles")}
          className="flex-row items-center gap-2"
        >
          <Ionicons name="arrow-back" size={20} color="#4f46e5" />
          <Text className="text-indigo-600 text-base">Back to Circles</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 p-4 bg-gray-50">
      <Pressable
        onPress={() => router.back()}
        className="flex-row items-center gap-2 mb-6"
      >
        <Ionicons name="arrow-back" size={20} color="#4f46e5" />
        <Text className="text-indigo-600 text-base">Back to Circles</Text>
      </Pressable>

      <View className="bg-white rounded-xl p-6 mb-6 shadow-sm">
        <Text className="text-3xl font-bold text-gray-800 mb-2">
          {circleDetails.info.name}
        </Text>
        <View className="flex-row items-center gap-3">
          <Text className="text-gray-600">
            Type: {CircleType[circleDetails.info.type]}
          </Text>
          {circleDetails.info.isDefault && (
            <View className="bg-blue-100 px-2 py-1 rounded-full">
              <Text className="text-blue-800 text-xs font-medium">Default</Text>
            </View>
          )}
        </View>
      </View>

      <View className="flex-row justify-between items-center mb-6">
        <View className="flex-row border-b border-gray-200">
          <Pressable
            onPress={() => setActiveTab("members")}
            className={`pb-3 px-4 border-b-2 ${
              activeTab === "members"
                ? "border-indigo-600"
                : "border-transparent"
            }`}
          >
            <Text
              className={`${
                activeTab === "members"
                  ? "text-indigo-600 font-medium"
                  : "text-gray-500"
              }`}
            >
              Members
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab("invitations")}
            className={`pb-3 px-4 border-b-2 ${
              activeTab === "invitations"
                ? "border-indigo-600"
                : "border-transparent"
            }`}
          >
            <Text
              className={`${
                activeTab === "invitations"
                  ? "text-indigo-600 font-medium"
                  : "text-gray-500"
              }`}
            >
              Invitations
            </Text>
          </Pressable>
        </View>

        {activeTab === "members" && (
          <Pressable
            onPress={() => setIsAddMembersModalOpen(true)}
            className="flex-row items-center gap-2 bg-indigo-600 py-2 px-4 rounded-lg"
          >
            <Feather name="user-plus" size={20} color="white" />
            <Text className="text-white font-medium">Add Members</Text>
          </Pressable>
        )}
      </View>

      {activeTab === "members" ? (
        <MembersList
          members={circleDetails.members || []}
          onRemove={handleRemoveMember}
          onEdit={handleEditMember}
          circleType={circleDetails.info.type}
        />
      ) : (
        <InvitationsList invitations={circleDetails.invitations || []} />
      )}

      <AddMembersModal
        visible={isAddMembersModalOpen}
        onClose={() => setIsAddMembersModalOpen(false)}
        onAdd={handleAddMembers}
        circleType={circleDetails.info.type}
      />
    </SafeAreaView>
  );
}
