import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { FontAwesome5 as Icon } from "@expo/vector-icons";
import useAwaitedAuthStore from "@/stores/AuthStore";
import protectRoute from "@/lib/protectRoute";
import { ContentType } from "@/lib/structures/content/posts/RecommendationRequest";
import { SafeAreaView } from "react-native-safe-area-context";

// Content type card component
interface ContentTypeCardProps {
  title: string;
  description: string;
  iconName: string;
  disabled?: boolean;
  onPress: () => void;
}

const ContentTypeCard = ({
  title,
  description,
  iconName,
  disabled = false,
  onPress,
}: ContentTypeCardProps) => (
  <Pressable
    className={`p-4 rounded-xl border mb-4 ${
      disabled
        ? "bg-gray-100 border-gray-200 opacity-60"
        : "bg-white border-gray-200 active:border-blue-500 active:shadow"
    }`}
    onPress={disabled ? undefined : onPress}
    disabled={disabled}
  >
    <View className="flex-row items-center mb-2">
      <Icon
        name={iconName}
        size={24}
        color="#2563eb"
        style={{ marginRight: 12 }}
      />
      <Text className="font-semibold text-lg">{title}</Text>
      {disabled && (
        <View className="absolute top-1 right-1 px-2 py-1 bg-gray-200 rounded-full">
          <Text className="text-gray-600 text-xs">Coming soon</Text>
        </View>
      )}
    </View>
    <Text className="text-gray-600 text-sm">{description}</Text>
  </Pressable>
);

export default function Create() {
  const { isLoaded, auth } = useAwaitedAuthStore();
  const router = useRouter();

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

  const contentTypes = [
    {
      category: "Short-form",
      types: [
        {
          id: "quote",
          title: "Quote",
          description:
            "Share your thoughts, ideas, or insights in text format, similar to Twitter posts.",
          icon: <i className="fas fa-quote-right"></i>,
          disabled: false,
          path: "/app/create/quote",
        },
        {
          id: "frame",
          title: "Frame",
          description:
            "Share photos and images with captions, similar to Instagram posts.",
          icon: <i className="fas fa-image"></i>,
          disabled: false,
          path: "/app/create/frame",
        },
        {
          id: "take",
          title: "Take",
          description:
            "Create short-form videos similar to TikTok or Instagram Reels.",
          icon: <i className="fas fa-video"></i>,
          disabled: true,
          path: "/app/create/take",
        },
      ],
    },
    {
      category: "Long-form",
      types: [
        {
          id: "discussion",
          title: "Discussion",
          description:
            "Start a conversation with your audience, similar to Reddit threads.",
          icon: <i className="fas fa-comments"></i>,
          disabled: true,
        },
        {
          id: "blog",
          title: "Blog/News",
          description:
            "Share in-depth articles, stories, or news with your audience.",
          icon: <i className="fas fa-newspaper"></i>,
          disabled: true,
        },
      ],
    },
    {
      category: "Media",
      types: [
        {
          id: "podcast",
          title: "Podcast",
          description: "Share audio content with your audience.",
          icon: <i className="fas fa-microphone"></i>,
          disabled: true,
        },
        {
          id: "music",
          title: "Music",
          description: "Share your music tracks with your audience.",
          icon: <i className="fas fa-music"></i>,
          disabled: true,
        },
        {
          id: "video",
          title: "Video",
          description:
            "Share long-form video content, similar to YouTube videos.",
          icon: <i className="fas fa-film"></i>,
          disabled: true,
        },
        {
          id: "stream",
          title: "Stream",
          description: "Go live and interact with your audience in real-time.",
          icon: <i className="fas fa-broadcast-tower"></i>,
          disabled: true,
        },
      ],
    },
    {
      category: "Interactive",
      types: [
        {
          id: "poll",
          title: "Poll",
          description: "Create polls to gather opinions from your audience.",
          icon: <i className="fas fa-poll"></i>,
          disabled: false,
          path: "/app/create/poll",
        },
        {
          id: "live-take",
          title: "Live Take",
          description: "Go live with short-form video content.",
          icon: <i className="fas fa-video"></i>,
          disabled: true,
        },
      ],
    },
  ];

  return (
    <SafeAreaView className="flex-1">
      <ScrollView className="flex-1 px-4 py-8 pb-24">
        <View className="mb-8">
          <Text className="text-3xl font-bold mb-2">Create New Post</Text>
          <Text className="text-gray-600">
            Choose the type of content you want to create
          </Text>
        </View>

        {contentTypes.map((category) => (
          <View key={category.category} className="mb-8">
            <View className="flex-row items-center mb-4">
              <Text className="text-xl font-semibold">{category.category}</Text>
              {category.category !== "Short-form" &&
                category.category !== "Interactive" && (
                  <View className="ml-2 px-2 py-1 bg-gray-200 rounded-full">
                    <Text className="text-gray-600 text-xs">Coming soon</Text>
                  </View>
                )}
            </View>
            {category.types.map((type) => (
              <ContentTypeCard
                key={type.id}
                title={type.title}
                description={type.description}
                iconName={type.icon.props.className
                  .split(" ")[1]
                  .replace("fa-", "")}
                disabled={type.disabled}
                onPress={() => router.push(type.path as any)}
              />
            ))}
          </View>
        ))}

        <View className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <Text className="text-lg font-medium text-blue-800 mb-2">
            Need help getting started?
          </Text>
          <Text className="text-blue-700">
            Check out our content creation guide for tips and best practices on
            creating engaging content.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
