import { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { PostAPI } from "@/lib/api/PostHelper";
import protectRoute from "@/lib/protectRoute";
import { ContentType } from "@/lib/structures/content/posts/RecommendationRequest";
import useAwaitedAuthStore from "@/stores/AuthStore";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CreateQuotePage() {
  const { isLoaded, auth } = useAwaitedAuthStore();
  const router = useRouter();

  // States
  const [error, setError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const maxCharCount = 1000;

  const handleQuoteSubmit = useCallback(async () => {
    setError(undefined);
    setIsSubmitting(true);

    try {
      if (!title.trim() || !content.trim()) {
        setError("You must fill in both title and content");
        return;
      }

      const result = await PostAPI.uploadPost({
        contentType: ContentType.Quote,
        title,
        content,
      });

      if (result.error) {
        setError(result.error.message);
        return;
      }

      router.replace("/");
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [title, content, router]);

  const handleContentChange = (text: string) => {
    setContent(text);
    setCharCount(text.length);
  };

  if (!isLoaded) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  const redirectTo = protectRoute(auth);
  if (redirectTo) {
    router.replace(redirectTo);
    return null;
  }

  return (
    <SafeAreaView className="flex-1">
      <ScrollView className="flex-1 px-4 py-8">
        <View className="mb-6 flex-row items-center">
          <Pressable onPress={() => router.back()} className="mr-3">
            <Feather name="arrow-left" size={20} color="#6b7280" />
          </Pressable>
          <Text className="text-2xl font-bold">Create a Quote</Text>
        </View>

        {error && (
          <View className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded">
            <Text className="text-red-700">{error}</Text>
          </View>
        )}

        <View className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <View className="space-y-6">
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1">
                Title
              </Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Add a compelling title..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1">
                Content
              </Text>
              <TextInput
                value={content}
                onChangeText={handleContentChange}
                multiline
                maxLength={maxCharCount}
                placeholder="Share your thoughts, ideas, or insights..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md min-h-[150px] placeholder-gray-400"
                placeholderTextColor="#9ca3af"
              />
              <View className="mt-1 flex-row justify-end">
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

            <View className="pt-4 border-t border-gray-200 flex-row justify-between items-center">
              <Text className="text-sm text-gray-500">
                Your quote will be visible to everyone
              </Text>
              <View className="flex-row gap-3">
                <Link href="/app/create" asChild>
                  <Pressable className="px-4 py-2 border border-gray-300 rounded-md bg-white">
                    <Text className="text-gray-700 text-sm font-medium">
                      Cancel
                    </Text>
                  </Pressable>
                </Link>
                <Pressable
                  onPress={handleQuoteSubmit}
                  disabled={isSubmitting}
                  className={`px-4 py-2 rounded-md ${
                    isSubmitting ? "bg-blue-300" : "bg-blue-600"
                  }`}
                >
                  {isSubmitting ? (
                    <View className="flex-row items-center">
                      <ActivityIndicator color="white" className="mr-2" />
                      <Text className="text-white text-sm font-medium">
                        Posting...
                      </Text>
                    </View>
                  ) : (
                    <Text className="text-white text-sm font-medium">
                      Post Quote
                    </Text>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </View>

        <View className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <Text className="text-sm font-medium text-blue-800 mb-2">
            Tips for great quotes
          </Text>
          <View className="gap-2">
            <Text className="text-blue-700 text-sm">
              • Keep it concise and meaningful
            </Text>
            <Text className="text-blue-700 text-sm">
              • Use a compelling title that captures attention
            </Text>
            <Text className="text-blue-700 text-sm">
              • Add context to help readers understand your perspective
            </Text>
            <Text className="text-blue-700 text-sm">
              • Consider using hashtags for better discoverability
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
