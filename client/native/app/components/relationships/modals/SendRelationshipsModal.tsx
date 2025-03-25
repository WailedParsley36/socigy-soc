import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import {
  RelationshipType,
  RelationshipDetailsRequest,
} from "@/lib/api/RelationshipHelper";
import { UserAPI, UserQueryResponse } from "@/lib/api/UserHelper";
import { ActivityIndicator } from "react-native-paper";

interface SendRelationshipModalProps {
  visible: boolean;
  onClose: () => void;
  onSend: (request: RelationshipDetailsRequest) => void;
}

export default function SendRelationshipModal({
  visible,
  onClose,
  onSend,
}: SendRelationshipModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserQueryResponse[]>([]);
  const [selectedType, setSelectedType] = useState<RelationshipType>(
    RelationshipType.Following
  );
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserQueryResponse | null>(
    null
  );

  const handleSearch = async (value?: string) => {
    value ??= searchQuery;
    if (!value.trim()) return;

    setIsSearching(true);
    try {
      const response = await UserAPI.queryUsers(value);
      if (response.result) {
        setSearchResults(response.result);
      }
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendRequest = () => {
    if (!selectedUser) return;

    onSend({
      targetUser: selectedUser.id,
      type: selectedType,
    });

    resetForm();
  };

  const resetForm = () => {
    setSearchQuery("");
    setSearchResults([]);
    setSelectedType(RelationshipType.Following);
    setSelectedUser(null);
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black bg-opacity-50 justify-center items-center">
        <View className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 m-4">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold text-gray-800">
              Connect with User
            </Text>
            <TouchableOpacity
              onPress={() => {
                resetForm();
                onClose();
              }}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {!selectedUser ? (
            <>
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-1">
                  Search for a user
                </Text>
                <View className="flex-row">
                  <TextInput
                    value={searchQuery}
                    onChangeText={(text) => {
                      setSearchQuery(text);
                      handleSearch(text);
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg"
                    placeholder="Enter username or email"
                  />
                  <TouchableOpacity
                    onPress={() => handleSearch()}
                    className="px-3 py-2 bg-indigo-600 rounded-r-lg"
                  >
                    <Ionicons name="search" size={20} color="white" />
                  </TouchableOpacity>
                </View>
              </View>

              {isSearching ? (
                <View className="justify-center items-center py-4">
                  <ActivityIndicator size="small" color="#4F46E5" />
                </View>
              ) : (
                <FlatList
                  data={searchResults}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      className="py-2 flex-row items-center p-2 rounded"
                      onPress={() => setSelectedUser(item)}
                    >
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
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={() =>
                    searchQuery && !isSearching ? (
                      <Text className="text-gray-500 text-center py-4">
                        No users found
                      </Text>
                    ) : null
                  }
                />
              )}
            </>
          ) : (
            <View className="mb-4">
              <View className="flex-row items-center mb-4">
                {selectedUser.iconUrl ? (
                  <Image
                    source={{ uri: selectedUser.iconUrl }}
                    className="h-12 w-12 rounded-full mr-3"
                  />
                ) : (
                  <View className="h-12 w-12 rounded-full bg-gray-200 items-center justify-center mr-3">
                    <Ionicons name="person" size={24} color="#6B7280" />
                  </View>
                )}
                <View>
                  <Text className="font-medium text-gray-800">
                    {selectedUser.username}
                    <Text className="text-gray-500 text-sm ml-1">
                      #{selectedUser.tag}
                    </Text>
                  </Text>
                </View>
              </View>

              <Text className="text-sm font-medium text-gray-700 mb-1">
                Relationship Type
              </Text>
              <Picker
                selectedValue={selectedType}
                onValueChange={(itemValue) =>
                  setSelectedType(itemValue as RelationshipType)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
              >
                <Picker.Item
                  label="Follow"
                  value={RelationshipType.Following}
                />
                <Picker.Item label="Friend" value={RelationshipType.Friend} />
                <Picker.Item
                  label="Subscription"
                  value={RelationshipType.Subscription}
                />
              </Picker>

              <Text className="text-sm text-gray-600 mb-4">
                {selectedType === RelationshipType.Following
                  ? "You will see their public posts in your feed."
                  : selectedType === RelationshipType.Friend
                  ? "Send a friend request. They will need to accept it."
                  : "Subscribe to their content (may require payment)."}
              </Text>
            </View>
          )}

          <View className="flex-row justify-end space-x-3">
            <TouchableOpacity
              onPress={() => {
                resetForm();
                onClose();
              }}
              className="px-4 py-2 bg-gray-100 rounded-lg"
            >
              <Text className="text-gray-700">Cancel</Text>
            </TouchableOpacity>
            {selectedUser ? (
              <TouchableOpacity
                onPress={handleSendRequest}
                className="px-4 py-2 bg-indigo-600 rounded-lg"
              >
                <Text className="text-white">Send Request</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                disabled={true}
                className="px-4 py-2 bg-indigo-300 rounded-lg"
              >
                <Text className="text-white">Send Request</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}
