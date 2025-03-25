import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  FlatList,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import {
  UserCircleMember,
  CircleMemberRole,
  CircleMemberBatchDetails,
  CircleType,
} from "@/lib/api/RelationshipHelper";
import { Guid } from "@/lib/structures/Guid";

interface MembersListProps {
  members: UserCircleMember[];
  onRemove: (userId: Guid) => void;
  onEdit: (member: CircleMemberBatchDetails) => void;
  circleType: CircleType;
}

export default function MembersList({
  members,
  onRemove,
  onEdit,
  circleType,
}: MembersListProps) {
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [nickname, setNickname] = useState<string>("");
  const [role, setRole] = useState<CircleMemberRole>(CircleMemberRole.Member);

  const handleEditClick = (member: UserCircleMember) => {
    setEditingMember(member.userId);
    setNickname(member.nickname || "");
    setRole(member.role);
  };

  const handleSaveEdit = (userId: Guid) => {
    onEdit({
      id: userId,
      nickname: nickname || undefined,
      role: circleType === CircleType.SharedGroup ? role : undefined,
    });
    setEditingMember(null);
  };

  const cancelEdit = () => {
    setEditingMember(null);
  };

  const renderMember = ({ item: member }: { item: UserCircleMember }) => (
    <View className="p-4 border-b border-gray-200">
      {editingMember === member.userId ? (
        <View className="space-y-3">
          <View className="flex-row items-center">
            {member.iconUrl ? (
              <Image
                source={{ uri: member.iconUrl }}
                className="h-10 w-10 rounded-full mr-3"
              />
            ) : (
              <View className="h-10 w-10 rounded-full bg-gray-200 items-center justify-center mr-3">
                <Ionicons name="person" size={20} color="#6B7280" />
              </View>
            )}
            <View>
              <Text className="font-medium text-gray-800">
                {member.username}
                {member.tag && (
                  <Text className="text-gray-500 text-sm ml-1">
                    #{member.tag}
                  </Text>
                )}
              </Text>
            </View>
          </View>

          <View className="space-y-4">
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1">
                Nickname
              </Text>
              <TextInput
                value={nickname}
                onChangeText={setNickname}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Nickname"
              />
            </View>
            {circleType === CircleType.SharedGroup && (
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1">
                  Role
                </Text>
                <Picker
                  selectedValue={role}
                  onValueChange={(itemValue) => setRole(itemValue)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <Picker.Item label="Member" value={CircleMemberRole.Member} />
                  <Picker.Item label="Admin" value={CircleMemberRole.Admin} />
                  <Picker.Item label="Owner" value={CircleMemberRole.Owner} />
                </Picker>
              </View>
            )}
          </View>

          <View className="flex-row justify-end space-x-2 mt-4">
            <TouchableOpacity
              onPress={cancelEdit}
              className="px-3 py-2 bg-gray-100 rounded-lg"
            >
              <Text className="text-sm text-gray-700">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleSaveEdit(member.userId)}
              className="px-3 py-2 bg-indigo-600 rounded-lg"
            >
              <Text className="text-sm text-white">Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center">
            {member.iconUrl ? (
              <Image
                source={{ uri: member.iconUrl }}
                className="h-10 w-10 rounded-full mr-3"
              />
            ) : (
              <View className="h-10 w-10 rounded-full bg-gray-200 items-center justify-center mr-3">
                <Ionicons name="person" size={20} color="#6B7280" />
              </View>
            )}
            <View>
              <Text className="font-medium text-gray-800">
                {member.username}
                {member.tag && (
                  <Text className="text-gray-500 text-sm ml-1">
                    #{member.tag}
                  </Text>
                )}
              </Text>
              {member.nickname && (
                <Text className="text-sm text-gray-500">
                  Nickname: {member.nickname}
                </Text>
              )}
              {circleType === CircleType.SharedGroup && (
                <Text className="text-sm text-gray-500">
                  Role: {CircleMemberRole[member.role]}
                </Text>
              )}
            </View>
          </View>
          <View className="flex-row space-x-2">
            <TouchableOpacity
              onPress={() => handleEditClick(member)}
              className="p-1.5"
            >
              <Ionicons name="pencil" size={20} color="#6B7280" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onRemove(member.userId)}
              className="p-1.5"
            >
              <Ionicons name="trash" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );

  if (members.length === 0) {
    return (
      <View className="items-center py-12">
        <Text className="text-gray-500">No members in this circle.</Text>
      </View>
    );
  }

  return (
    <View className="bg-white rounded-xl shadow-md">
      <FlatList
        data={members}
        renderItem={renderMember}
        keyExtractor={(item) => item.userId}
      />
    </View>
  );
}
