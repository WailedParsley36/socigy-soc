import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { PostAPI } from "@/lib/api/PostHelper";
import { ContentType } from "@/lib/structures/content/posts/RecommendationRequest";
import useAwaitedAuthStore from "@/stores/AuthStore";
import { Ionicons } from "@expo/vector-icons";
import DraggableFlatList, {
  RenderItemParams,
} from "react-native-draggable-flatlist";
import { VisibilityType } from "@/lib/structures/content/posts/RecommendedPost";

interface ImageItem {
  id: string;
  uri: string;
}

import * as FileSystem from "expo-file-system";

const uriToFile = async (uri: string): Promise<File> => {
  const response = await fetch(uri);
  const blob = await response.blob();
  return new File([blob], "image.jpg", { type: "image/jpeg" });
};

export default function CreateFramePage() {
  const { isLoaded, auth } = useAwaitedAuthStore();
  const router = useRouter();

  const [error, setError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [selectedImages, setSelectedImages] = useState<ImageItem[]>([]);
  const [content, setContent] = useState("");

  const maxCharCount = 1000;
  const maxImages = 10;

  const handleFrameSubmit = useCallback(async () => {
    setError(undefined);
    setIsSubmitting(true);

    try {
      if (
        selectedImages.length === 0 ||
        selectedImages.length > maxImages ||
        !content.trim()
      ) {
        setError(`Please select 1-${maxImages} images and add a caption`);
        setIsSubmitting(false);
        return;
      }

      // Convert image URIs to File objects
      const filePromises = selectedImages.map((img) => uriToFile(img.uri));
      const files = await Promise.all(filePromises);

      const result = await PostAPI.uploadPost({
        contentType: ContentType.Frame,
        content: content,
        files: files,
        visibility: VisibilityType.Public,
      });

      if (result.error) {
        setError(result.error.message);
        setIsSubmitting(false);
        return;
      }

      router.replace("/");
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setIsSubmitting(false);
    }
  }, [selectedImages, content, router]);

  const handleContentChange = useCallback((text: string) => {
    setCharCount(text.length);
    setContent(text);
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled && result.assets) {
      const newImages = result.assets.map((asset) => ({
        id: `image-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        uri: asset.uri,
      }));
      setSelectedImages((prev) => [...prev, ...newImages].slice(0, maxImages));
    }
  };

  const removeImage = (id: string) => {
    setSelectedImages((prev) => prev.filter((img) => img.id !== id));
  };

  const renderImage = ({
    item,
    drag,
    isActive,
  }: RenderItemParams<ImageItem>) => (
    <TouchableOpacity
      onLongPress={drag}
      className={`relative aspect-square ${isActive ? "opacity-50" : ""}`}
    >
      <Image source={{ uri: item.uri }} className="h-full w-full rounded-md" />
      <TouchableOpacity
        onPress={() => removeImage(item.id)}
        className="absolute top-1 right-1 bg-red-500 rounded-full p-1"
      >
        <Ionicons name="close" size={16} color="white" />
      </TouchableOpacity>
      <View className="absolute bottom-1 left-1 bg-black bg-opacity-50 px-2 py-1 rounded-full">
        <Text className="text-white text-xs">
          {selectedImages.findIndex((img) => img.id === item.id) + 1}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (!isLoaded) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  if (!auth.user) {
    router.replace("/login");
    return null;
  }

  return (
    <ScrollView className="flex-1 bg-white px-4 py-8">
      <View className="mb-6 flex-row items-center">
        <TouchableOpacity
          onPress={() => router.push("/app/create")}
          className="mr-3"
        >
          <Ionicons name="arrow-back" size={24} color="#6B7280" />
        </TouchableOpacity>
        <Text className="text-2xl font-bold">Create a Frame</Text>
      </View>

      {error && (
        <View className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded">
          <Text className="text-red-700">{error}</Text>
        </View>
      )}

      <View className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <View className="mb-6">
          <Text className="text-sm font-medium text-gray-700 mb-1">Images</Text>
          <TouchableOpacity
            onPress={pickImage}
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 items-center"
          >
            <Ionicons name="images-outline" size={48} color="#9CA3AF" />
            <Text className="mt-2 text-sm text-gray-600">
              Click to upload images
            </Text>
            <Text className="text-xs text-gray-500 mt-1">
              JPG, PNG, GIF up to {maxImages} images
            </Text>
          </TouchableOpacity>

          {selectedImages.length > 0 && (
            <View className="mt-4">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-sm font-medium text-gray-700">
                  Selected Images ({selectedImages.length}/{maxImages})
                </Text>
                <Text className="text-xs text-gray-500">Drag to reorder</Text>
              </View>
              <DraggableFlatList
                data={selectedImages}
                renderItem={renderImage}
                keyExtractor={(item) => item.id}
                onDragEnd={({ data }) => setSelectedImages(data)}
                numColumns={3}
              />
            </View>
          )}
        </View>

        <View className="mb-6">
          <Text className="text-sm font-medium text-gray-700 mb-1">
            Caption
          </Text>
          <TextInput
            multiline
            numberOfLines={4}
            maxLength={maxCharCount}
            placeholder="Write a caption for your images..."
            onChangeText={handleContentChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
          <View className="mt-1 items-end">
            <Text
              className={`text-xs ${
                charCount > maxCharCount * 0.9
                  ? "text-red-500"
                  : "text-gray-500"
              }`}
            >
              {charCount}/{maxCharCount}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center justify-between pt-4 border-t border-gray-200">
          <Text className="text-sm text-gray-500">
            Your frame will be visible to everyone
          </Text>
          <View className="flex-row space-x-3">
            <TouchableOpacity
              onPress={() => router.push("/app/create")}
              className="px-4 py-2 border border-gray-300 rounded-md"
            >
              <Text className="text-sm font-medium text-gray-700">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleFrameSubmit}
              disabled={isSubmitting || selectedImages.length === 0}
              className={`px-4 py-2 rounded-md ${
                isSubmitting || selectedImages.length === 0
                  ? "bg-blue-300"
                  : "bg-blue-600"
              }`}
            >
              {isSubmitting ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text className="text-sm font-medium text-white">
                  Post Frame
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
        <Text className="text-sm font-medium text-blue-800 mb-2">
          Tips for great frames
        </Text>
        <View className="ml-5">
          {[
            "Use high-quality images that are clear and well-composed",
            "Arrange your images in a logical order to tell a story",
            "Write a descriptive caption that adds context to your images",
            "Use hashtags in your caption to increase discoverability",
          ].map((tip, index) => (
            <View key={index} className="flex-row items-center">
              <View className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
              <Text className="text-sm text-blue-700">{tip}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
