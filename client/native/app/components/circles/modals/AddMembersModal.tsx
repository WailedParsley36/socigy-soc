import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  Image,
  Modal,
  ActivityIndicator,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { AntDesign, Feather, Ionicons } from "@expo/vector-icons";
import {
  CircleMemberBatchDetails,
  CircleType,
  CircleMemberRole,
  RelationshipType,
} from "@/lib/api/RelationshipHelper";
import { UserAPI, UserQueryResponse } from "@/lib/api/UserHelper";

interface AddMembersModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (members: CircleMemberBatchDetails[]) => void;
  circleType: CircleType;
}

function getRelationshipTypeFromCircleType(
  type: CircleType
): RelationshipType | undefined {
  switch (type) {
    case CircleType.Following:
      return RelationshipType.Following;
    case CircleType.Followers:
      return RelationshipType.Follower;
    case CircleType.Friends:
      return RelationshipType.Friend;
    case CircleType.Subscribers:
      return RelationshipType.Subscriber;
    case CircleType.Subscriptions:
      return RelationshipType.Subscription;
  }
}

export default function AddMembersModal({
  visible,
  onClose,
  onAdd,
  circleType,
}: AddMembersModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserQueryResponse[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<
    Map<string, CircleMemberBatchDetails>
  >(new Map());
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!visible) {
      setSearchQuery("");
      setSearchResults([]);
      setSelectedUsers(new Map());
    }
  }, [visible]);

  const handleSearch = async (value?: string) => {
    value ??= searchQuery;
    if (!value.trim()) return;

    setIsSearching(true);
    try {
      console.log("CIRCLE TYPE", circleType);
      const relType = getRelationshipTypeFromCircleType(circleType);
      const response = await UserAPI.queryUsers(value, relType);
      if (response.result) {
        const filteredResults = response.result.filter(
          (user) => !selectedUsers.has(user.id)
        );
        setSearchResults(filteredResults);
      }
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectUser = (user: UserQueryResponse) => {
    const updatedUsers = new Map(selectedUsers);
    updatedUsers.set(user.id, {
      id: user.id,
      nickname: "",
      role: CircleMemberRole.Member,
    });
    setSelectedUsers(updatedUsers);

    // Remove from search results
    setSearchResults(searchResults.filter((result) => result.id !== user.id));
  };

  const handleRemoveUser = (userId: string) => {
    const updatedUsers = new Map(selectedUsers);
    updatedUsers.delete(userId);
    setSelectedUsers(updatedUsers);
  };

  const handleChangeNickname = (userId: string, nickname: string) => {
    const updatedUsers = new Map(selectedUsers);
    const user = updatedUsers.get(userId);
    if (user) {
      updatedUsers.set(userId, { ...user, nickname });
      setSelectedUsers(updatedUsers);
    }
  };

  const handleChangeRole = (userId: string, role: CircleMemberRole) => {
    const updatedUsers = new Map(selectedUsers);
    const user = updatedUsers.get(userId);
    if (user) {
      updatedUsers.set(userId, { ...user, role });
      setSelectedUsers(updatedUsers);
    }
  };

  const handleSubmit = () => {
    onAdd(Array.from(selectedUsers.values()));
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View className="flex-1 bg-black bg-opacity-50 justify-center items-center p-4">
        <View className="bg-white rounded-xl w-full max-w-lg p-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold text-gray-800">
              Add Members to Circle
            </Text>
            <Pressable onPress={onClose}>
              <AntDesign name="close" size={24} color="#6B7280" />
            </Pressable>
          </View>

          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 mb-1">
              Search for users to add
            </Text>
            <View className="flex-row">
              <TextInput
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  handleSearch(text);
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg"
                placeholder="Search by username or email"
                onSubmitEditing={() => handleSearch()}
              />
              <Pressable
                onPress={() => handleSearch()}
                className="px-3 py-2 bg-indigo-600 rounded-r-lg items-center justify-center"
              >
                <Feather name="search" size={20} color="white" />
              </Pressable>
            </View>
          </View>

          {isSearching ? (
            <ActivityIndicator size="small" color="#4F46E5" />
          ) : (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id}
              className="max-h-48 mb-4 border border-gray-200 rounded-lg"
              ListEmptyComponent={
                <Text className="text-gray-500 text-center py-4">
                  {searchQuery ? "No users found" : "Search for users to add"}
                </Text>
              }
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => handleSelectUser(item)}
                  className="p-3 flex-row justify-between items-center border-b border-gray-200"
                >
                  <View className="flex-row items-center">
                    {item.iconUrl ? (
                      <Image
                        source={{ uri: item.iconUrl }}
                        className="h-8 w-8 rounded-full mr-3"
                      />
                    ) : (
                      <View className="h-8 w-8 rounded-full bg-gray-200 items-center justify-center mr-3">
                        <Ionicons name="person" size={16} color="#6B7280" />
                      </View>
                    )}
                    <View>
                      <Text className="font-medium text-gray-800">
                        {item.username}
                        <Text className="text-gray-500 text-sm ml-1">
                          #{item.tag}
                        </Text>
                      </Text>
                    </View>
                  </View>
                  <AntDesign name="plus" size={20} color="#4F46E5" />
                </Pressable>
              )}
            />
          )}

          {selectedUsers.size > 0 && (
            <View className="mb-6">
              <Text className="text-md font-medium text-gray-700 mb-2">
                Selected Users
              </Text>
              <FlatList
                data={Array.from(selectedUsers.entries())}
                keyExtractor={([userId]) => userId}
                renderItem={({ item: [userId, details] }) => {
                  const user = searchResults.find((u) => u.id === userId);
                  return (
                    <View className="bg-gray-50 p-3 rounded-lg mb-2">
                      <View className="flex-row justify-between items-start">
                        <View className="flex-row items-center">
                          <View className="h-8 w-8 rounded-full bg-gray-200 items-center justify-center mr-3">
                            <Ionicons name="person" size={16} color="#6B7280" />
                          </View>
                          <Text className="font-medium text-gray-800">
                            {user?.username || userId}
                          </Text>
                        </View>
                        <Pressable onPress={() => handleRemoveUser(userId)}>
                          <AntDesign name="close" size={20} color="#DC2626" />
                        </Pressable>
                      </View>
                      <View className="mt-3">
                        <Text className="text-xs font-medium text-gray-700 mb-1">
                          Nickname (optional)
                        </Text>
                        <TextInput
                          value={details.nickname || ""}
                          onChangeText={(text) =>
                            handleChangeNickname(userId, text)
                          }
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                          placeholder="Nickname"
                        />
                      </View>
                      {circleType === CircleType.SharedGroup && (
                        <View className="mt-3">
                          <Text className="text-xs font-medium text-gray-700 mb-1">
                            Role
                          </Text>
                          <Picker
                            selectedValue={details.role}
                            onValueChange={(itemValue) =>
                              handleChangeRole(
                                userId,
                                itemValue as CircleMemberRole
                              )
                            }
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                          >
                            <Picker.Item
                              label="Member"
                              value={CircleMemberRole.Member}
                            />
                            <Picker.Item
                              label="Admin"
                              value={CircleMemberRole.Admin}
                            />
                            <Picker.Item
                              label="Owner"
                              value={CircleMemberRole.Owner}
                            />
                          </Picker>
                        </View>
                      )}
                    </View>
                  );
                }}
              />
            </View>
          )}

          <View className="flex-row justify-end gap-3">
            <Pressable
              onPress={onClose}
              className="px-4 py-2 bg-gray-100 rounded-lg"
            >
              <Text className="text-gray-700">Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleSubmit}
              disabled={selectedUsers.size === 0}
              className={`px-4 py-2 rounded-lg ${
                selectedUsers.size === 0 ? "bg-indigo-300" : "bg-indigo-600"
              }`}
            >
              <Text className="text-white">Add Members</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
