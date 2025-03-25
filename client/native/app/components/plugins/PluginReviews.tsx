import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  Image,
  ScrollView,
} from "react-native";
import { PluginAPI, PluginReview } from "@/lib/api/PluginAPI";
import type { Guid } from "@/lib/structures/Guid";
import {
  userDisplayName,
  UserShallowInfo,
} from "@/lib/structures/content/posts/RecommendedPost";

interface PluginReviewsProps {
  pluginId: Guid;
}

export default function PluginReviews({ pluginId }: PluginReviewsProps) {
  const [reviews, setReviews] = useState<PluginReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [userReview, setUserReview] = useState<string>("");
  const [userRating, setUserRating] = useState<number>(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadReviews = async () => {
    try {
      const response = await PluginAPI.listPluginReviews(pluginId);
      if (response.result) {
        setReviews(response.result);
      }
    } catch (error) {
      console.error("Failed to load plugin reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [pluginId]);

  const handleSubmitReview = async () => {
    if (!userReview.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await PluginAPI.addOrEditPluginReview(pluginId, {
        rating: userRating,
        reviewText: userReview,
      });

      if (response.result) {
        setUserReview("");
        setUserRating(5);
        loadReviews();
      }
    } catch (error) {
      console.error("Failed to submit review:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderReview = ({ item }: { item: PluginReview }) => (
    <View className="p-6 border-b border-gray-200 dark:border-gray-700">
      <View className="flex-row items-center mb-3">
        <View className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mr-3 items-center justify-center">
          {item.iconUrl ? (
            <Image
              source={{ uri: item.iconUrl }}
              style={{ width: 40, height: 40 }}
              className="h-full w-full object-cover"
            />
          ) : (
            <Text className="text-blue-600 font-medium text-lg">
              {item.username?.charAt(0) || "U"}
            </Text>
          )}
        </View>
        <View>
          <Text className="font-medium text-gray-900 dark:text-white">
            {userDisplayName(item as any as UserShallowInfo)}
          </Text>
          <Text className="text-sm text-gray-600 dark:text-gray-400">
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>

        <View className="ml-auto flex-row">
          {[...Array(5)].map((_, i) => (
            <Text
              key={i}
              className={`${
                i < item.rating
                  ? "text-yellow-400"
                  : "text-gray-300 dark:text-gray-600"
              }`}
            >
              ★
            </Text>
          ))}
        </View>
      </View>

      <Text className="text-gray-700 dark:text-gray-300">
        {item.reviewText}
      </Text>

      <View className="mt-3 flex-row justify-end">
        <Pressable>
          <Text className="text-sm text-gray-500 dark:text-gray-400">
            Report
          </Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
      <View className="p-6 border-b border-gray-200 dark:border-gray-700">
        <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Reviews
        </Text>

        <View className="mb-6">
          <View className="mb-4">
            <Text className="text-gray-700 dark:text-gray-300 mb-2">
              Your Rating
            </Text>
            <View className="flex-row">
              {[1, 2, 3, 4, 5].map((star) => (
                <Pressable key={star} onPress={() => setUserRating(star)}>
                  <Text
                    className={`text-2xl ${
                      userRating >= star
                        ? "text-yellow-400"
                        : "text-gray-300 dark:text-gray-600"
                    }`}
                  >
                    ★
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-gray-700 dark:text-gray-300 mb-2">
              Your Review
            </Text>
            <TextInput
              value={userReview}
              onChangeText={setUserReview}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
              multiline
              numberOfLines={4}
              placeholder="Share your experience with this plugin..."
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <Pressable
            onPress={handleSubmitReview}
            disabled={isSubmitting || !userReview.trim()}
            className={`px-4 py-2 bg-blue-600 rounded-md ${
              isSubmitting || !userReview.trim() ? "opacity-50" : ""
            }`}
          >
            <Text className="text-white text-center">
              {isSubmitting ? "Submitting..." : "Submit Review"}
            </Text>
          </Pressable>
        </View>
      </View>

      {loading ? (
        <View className="p-6 space-y-4">
          {[...Array(3)].map((_, i) => (
            <View key={i} className="animate-pulse">
              <View className="flex-row items-center mb-2">
                <View className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
                <View className="ml-3 w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
              </View>
              <View className="space-y-2">
                <View className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                <View className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
              </View>
            </View>
          ))}
        </View>
      ) : reviews.length === 0 ? (
        <View className="p-6">
          <Text className="text-center text-gray-500 dark:text-gray-400">
            No reviews yet. Be the first to share your experience!
          </Text>
        </View>
      ) : (
        <FlatList
          data={reviews}
          renderItem={renderReview}
          keyExtractor={(item) => item.review_id.toString()}
          className="max-h-[600px]"
        />
      )}

      {reviews.length > 0 && (
        <View className="p-4 border-t border-gray-200 dark:border-gray-700">
          <Pressable>
            <Text className="text-blue-600 dark:text-blue-400 text-center">
              View All Reviews
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
