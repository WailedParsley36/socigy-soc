import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  RelationshipAPI,
  UserCircle,
  EditCircleDetailsRequest,
} from "@/lib/api/RelationshipHelper";
import CircleCard from "@/components/circles/CircleCard";
import { CreateCircleModal } from "@/components/circles/modals/CreateCircleModal";
import { Guid } from "@/lib/structures/Guid";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CirclesPage() {
  const [circles, setCircles] = useState<UserCircle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    loadCircles();
  }, []);

  const loadCircles = async () => {
    setIsLoading(true);
    const response = await RelationshipAPI.listCircles(50, 0);
    if (response.result) {
      setCircles(response.result);
    }
    setIsLoading(false);
  };

  const handleCreateCircle = async (details: EditCircleDetailsRequest) => {
    const response = await RelationshipAPI.createCircle(details);
    if (response.result) {
      setCircles([...circles, response.result]);
      setIsCreateModalOpen(false);
    }
  };

  const handleDeleteCircle = async (circleId: Guid) => {
    await RelationshipAPI.deleteCircle(circleId);
    setCircles(circles.filter((circle) => circle.id !== circleId));
  };

  return (
    <SafeAreaView className="flex-1 bg-white px-4 py-8">
      <View className="flex-row justify-between items-center mb-8">
        <Text className="text-3xl font-bold text-gray-800">My Circles</Text>
        <TouchableOpacity
          onPress={() => setIsCreateModalOpen(true)}
          className="flex-row items-center bg-indigo-600 py-2 px-4 rounded-lg"
        >
          <Ionicons name="add" size={20} color="white" />
          <Text className="text-white font-medium ml-2">Create Circle</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      ) : (
        <FlatList
          data={circles}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <CircleCard circle={item} onDelete={handleDeleteCircle} />
          )}
          numColumns={1}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}

      <CreateCircleModal
        visible={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateCircle}
      />
    </SafeAreaView>
  );
}
