import { View, Text, Image, Pressable } from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import {
  UserCircleInvitation,
  RelationshipStatus,
} from "@/lib/api/RelationshipHelper";

interface InvitationsListProps {
  invitations: UserCircleInvitation[];
}

export function InvitationsList({ invitations }: InvitationsListProps) {
  if (invitations.length === 0) {
    return (
      <View className="py-12 items-center">
        <Text className="text-gray-500">
          No pending invitations for this circle.
        </Text>
      </View>
    );
  }

  const getStatusBadge = (status: RelationshipStatus) => {
    const baseStyle = "px-2 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case RelationshipStatus.Pending:
        return (
          <Text className={`${baseStyle} bg-yellow-100 text-yellow-800`}>
            Pending
          </Text>
        );
      case RelationshipStatus.Accepted:
        return (
          <Text className={`${baseStyle} bg-green-100 text-green-800`}>
            Accepted
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
    <View className="bg-white rounded-xl shadow-sm">
      {invitations.map((invitation) => (
        <View
          key={invitation.invitation_id}
          className="p-4 border-b border-gray-200"
        >
          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center flex-1">
              {invitation.inviteeIconUrl ? (
                <Image
                  source={{ uri: invitation.inviteeIconUrl }}
                  className="h-10 w-10 rounded-full mr-3"
                  accessibilityLabel={
                    invitation.inviteeUsername || "User avatar"
                  }
                />
              ) : (
                <View className="h-10 w-10 rounded-full bg-gray-200 items-center justify-center mr-3">
                  <Feather name="user" size={20} color="#6b7280" />
                </View>
              )}

              <View className="flex-1">
                <Text className="font-medium text-gray-800">
                  {invitation.inviteeUsername}
                  {invitation.inviteeTag && (
                    <Text className="text-gray-500 text-sm ml-1">
                      #{invitation.inviteeTag}
                    </Text>
                  )}
                </Text>

                {invitation.nickname && (
                  <Text className="text-sm text-gray-500 mt-1">
                    Nickname: {invitation.nickname}
                  </Text>
                )}

                <View className="flex-row items-center mt-1">
                  {getStatusBadge(invitation.status)}
                  <Text className="text-gray-500 text-xs ml-2">
                    Invited:{" "}
                    {new Date(invitation.invitedAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            </View>

            {invitation.status === RelationshipStatus.Pending && (
              <View className="flex-row gap-2">
                <Pressable
                  className="p-1.5 rounded-full active:opacity-75"
                  accessibilityLabel="Resend invitation"
                >
                  <Feather name="check" size={20} color="#16a34a" />
                </Pressable>
                <Pressable
                  className="p-1.5 rounded-full active:opacity-75"
                  accessibilityLabel="Cancel invitation"
                >
                  <Ionicons name="close" size={20} color="#dc2626" />
                </Pressable>
              </View>
            )}
          </View>
        </View>
      ))}
    </View>
  );
}
