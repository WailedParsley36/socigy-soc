import React, { useCallback, useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import LoadingScreen from "@/components/LoadingScreen";
import DisplayPost from "@/components/posts/DisplayPost";
import { PostAPI } from "@/lib/api/PostHelper";
import useAwaitedAuthStore from "@/stores/AuthStore";
import {
  RecommendedPost,
  UserRegistry,
} from "@/lib/structures/content/posts/RecommendedPost";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import protectRoute from "@/lib/protectRoute";

export default function Home() {
  const { isLoaded, auth } = useAwaitedAuthStore();
  const router = useRouter();

  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const [noMorePosts, setNoMorePosts] = useState(false);
  const [loadedUsers, setLoadedUsers] = useState<UserRegistry>({});
  const [loadedPosts, setLoadedPosts] = useState<RecommendedPost[]>([]);
  const [activeTab, setActiveTab] = useState<"foryou" | "following">("foryou");

  const handleLoadMorePosts = async () => {
    if (isLoading || noMorePosts) return;

    setIsLoading(true);
    try {
      const postResponse = await PostAPI.recommendPosts({
        limit: 10,
        offset: loadedPosts.length,
      });

      if (postResponse.error) {
        setError(postResponse.error.message);
        return;
      }

      if (postResponse.result?.posts.length === 0) {
        setNoMorePosts(true);
        return;
      }

      setLoadedPosts(postResponse.result!.posts);
      setLoadedUsers(postResponse.result!.users);
    } catch (err) {
      console.error("Failed to load posts:", err);
      setError("Failed to load posts. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoaded) return;
    handleLoadMorePosts();
  }, [isLoaded, handleLoadMorePosts]);

  if (!isLoaded) {
    return <LoadingScreen />;
  }

  const redirect = protectRoute(auth);
  if (redirect) return redirect;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Top Navigation Bar */}
      <View className="bg-white shadow-sm py-3 px-4 flex-row justify-between items-center">
        <Text className="text-2xl font-bold text-blue-600">Socigy</Text>
        <View className="flex-row space-x-4">
          <TouchableOpacity onPress={() => router.push("/app/search")}>
            <Ionicons name="search" size={24} color="#4B5563" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/app/notifications")}>
            <Ionicons name="notifications" size={24} color="#4B5563" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Feed Tabs */}
      <View className="flex-row space-x-8 border-b border-gray-200 bg-white">
        <TouchableOpacity
          onPress={() => setActiveTab("foryou")}
          className={`pb-4 px-1 ${
            activeTab === "foryou" ? "border-b-2 border-blue-500" : ""
          }`}
        >
          <Text
            className={`${
              activeTab === "foryou"
                ? "text-blue-600 font-medium"
                : "text-gray-500"
            }`}
          >
            For You
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("following")}
          className={`pb-4 px-1 ${
            activeTab === "following" ? "border-b-2 border-blue-500" : ""
          }`}
        >
          <Text
            className={`${
              activeTab === "following"
                ? "text-blue-600 font-medium"
                : "text-gray-500"
            }`}
          >
            Following
          </Text>
        </TouchableOpacity>
      </View>

      {/* Create Post Quick Access */}
      <TouchableOpacity
        onPress={() => router.push("/app/create")}
        className="bg-white rounded-lg shadow-sm p-4 m-4 flex-row items-center"
      >
        <View className="h-10 w-10 rounded-full bg-blue-100 items-center justify-center mr-3">
          {auth.user?.iconUrl ? (
            <Image
              source={{ uri: auth.user.iconUrl }}
              className="h-full w-full rounded-full"
            />
          ) : (
            <Text className="text-blue-600 font-medium">
              {auth.user?.displayName?.charAt(0) || "U"}
            </Text>
          )}
        </View>
        <Text className="text-gray-500">What's on your mind?</Text>
      </TouchableOpacity>

      {/* Error Message */}
      {error && (
        <View className="bg-red-50 border-l-4 border-red-500 p-4 m-4 rounded">
          <Text className="text-red-700">{error}</Text>
          <TouchableOpacity
            onPress={() => {
              setError(undefined);
              handleLoadMorePosts();
            }}
            className="mt-2"
          >
            <Text className="text-sm font-medium text-red-600">Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Posts */}
      <FlatList
        data={loadedPosts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="mb-4">
            <DisplayPost
              post={item}
              users={loadedUsers}
              currentUserId={auth.user!.id}
            />
          </View>
        )}
        ListEmptyComponent={() => (
          <View className="bg-white rounded-lg shadow-sm p-8 m-4 items-center">
            <Text className="text-gray-500">No posts to display</Text>
            <TouchableOpacity
              onPress={handleLoadMorePosts}
              className="mt-4 px-4 py-2 bg-blue-600 rounded-md"
            >
              <Text className="text-white">Refresh</Text>
            </TouchableOpacity>
          </View>
        )}
        onEndReached={handleLoadMorePosts}
        onEndReachedThreshold={0.1}
        ListFooterComponent={() =>
          isLoading ? (
            <View className="py-4 items-center mb-24">
              <ActivityIndicator color="#3B82F6" />
              <Text className="text-gray-500 mt-2">Loading more posts...</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}
