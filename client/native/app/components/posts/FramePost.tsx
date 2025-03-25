import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { format } from "date-fns";
import { Image } from "expo-image";
import { ResizeMode, Video } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import { Comment, ContentAPI } from "@/lib/api/ContentHelper";
import {
  RecommendedPost,
  UserRegistry,
  userDisplayName,
  MediaType,
  UserShallowInfo,
} from "@/lib/structures/content/posts/RecommendedPost";
import { Guid } from "@/lib/structures/Guid";
import clsx from "clsx";

interface FramePostProps {
  post: RecommendedPost;
  users: UserRegistry;
  currentUserId: string;
  onLike: (postId: Guid) => void;
  onDislike: (postId: Guid) => void;
  onComment: (postId: Guid, content: string) => void;
  onShare: (postId: Guid) => void;
}

export default function FramePost({
  post,
  users,
  currentUserId,
  onLike,
  onDislike,
  onComment,
  onShare,
}: FramePostProps) {
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState(post.comments || []);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentPage, setCommentPage] = useState(0);
  const [hasMoreComments, setHasMoreComments] = useState(true);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  const handleLike = () => onLike(post.id);
  const handleDislike = () => onDislike(post.id);
  const handleShare = () => onShare(post.id);

  const handleCommentSubmit = () => {
    if (commentText.trim()) {
      onComment(post.id, commentText);
      const newComment: Comment = {
        id: "10852470-cf97-427e-b0af-b57bf015d8c5" as Guid,
        postId: post.id,
        userId: currentUserId as Guid,
        content: commentText,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setComments([newComment, ...comments]);
      setCommentText("");
    }
  };

  const loadMoreComments = async () => {
    if (isLoadingComments || !hasMoreComments) return;

    setIsLoadingComments(true);
    try {
      const nextPage = commentPage + 1;
      const result = await ContentAPI.getComments(
        post.id,
        false,
        10,
        nextPage * 10
      );

      if (result.result) {
        if (result.result.length === 0) {
          setHasMoreComments(false);
        } else {
          setComments([...comments, ...result.result]);
          setCommentPage(nextPage);
        }
      }
    } catch (error) {
      console.error("Failed to load more comments:", error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  useEffect(() => {
    if (showComments && comments.length === 0 && !isLoadingComments) {
      loadMoreComments();
    }
  }, [showComments]);

  const postOwner = users[post.userId];
  postOwner.id = post.userId;

  const getInitials = (name: string) => {
    if (!name) return "?";
    return name
      .replace(" #", "")
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const getAvatarColor = (userId: Guid) => {
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-red-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-teal-500",
      "bg-orange-500",
    ];

    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }

    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const renderAvatar = (
    user: UserShallowInfo,
    size: "sm" | "md" | "lg" = "md"
  ) => {
    const sizeClasses = {
      sm: "w-8 h-8",
      md: "w-10 h-10",
      lg: "w-12 h-12",
    };

    if (user?.iconUrl) {
      return (
        <Image
          cachePolicy={"memory-disk"}
          source={{ uri: user.iconUrl }}
          className={clsx("rounded-full", sizeClasses)}
        />
      );
    } else {
      const initials = getInitials(user.username ?? "Y") ?? "?";
      const bgColor = getAvatarColor(user.id || ("unknown" as Guid));

      return (
        <View
          className={`${sizeClasses[size]} ${bgColor} rounded-full items-center justify-center`}
        >
          <Text className="text-white font-bold">{initials}</Text>
        </View>
      );
    }
  };

  const sortedMedia = post.media
    ? [...post.media].sort((a, b) => a.position - b.position)
    : [];

  const nextMedia = () => {
    if (sortedMedia.length > 0) {
      setActiveMediaIndex((activeMediaIndex + 1) % sortedMedia.length);
    }
  };

  const prevMedia = () => {
    if (sortedMedia.length > 0) {
      setActiveMediaIndex(
        (activeMediaIndex - 1 + sortedMedia.length) % sortedMedia.length
      );
    }
  };

  return (
    <View className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
      {/* Header */}
      <View className="p-4">
        <View className="flex-row items-start">
          <View className="mr-3">{renderAvatar(postOwner)}</View>
          <View className="flex-1">
            <View className="flex-row items-baseline">
              <Text className="font-bold">
                {postOwner?.displayName || "Unknown User"}
              </Text>
              <Text className="ml-2 text-sm text-gray-500">
                @{userDisplayName(postOwner)}
              </Text>
            </View>
            <Text className="text-xs text-gray-500">
              {post.updatedAt || post.scheduledAt
                ? format(
                    new Date(post.updatedAt || post.scheduledAt!),
                    "MMM d, yyyy • h:mm a"
                  )
                : "Unknown date"}
            </Text>
          </View>
        </View>
      </View>

      {/* Media Gallery */}
      {sortedMedia.length > 0 && (
        <View className="relative">
          {/* Main media display */}
          <View className="bg-gray-100 relative">
            {sortedMedia[activeMediaIndex].mediaType === MediaType.Image ? (
              <Image
                source={{ uri: sortedMedia[activeMediaIndex].url }}
                style={{ aspectRatio: 16 / 9 }}
                cachePolicy={"memory-disk"}
                contentFit="contain"
              />
            ) : sortedMedia[activeMediaIndex].mediaType === MediaType.Video ? (
              <Video
                source={{ uri: sortedMedia[activeMediaIndex].url }}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                style={{ aspectRatio: 16 / 9 }}
              />
            ) : (
              <View className="aspect-w-16 aspect-h-9 items-center justify-center bg-gray-200">
                <Text>Unsupported media type</Text>
              </View>
            )}

            {/* Navigation arrows for multiple media */}
            {sortedMedia.length > 1 && (
              <>
                <TouchableOpacity
                  onPress={prevMedia}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 rounded-full p-2"
                >
                  <Ionicons name="chevron-back" size={24} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={nextMedia}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 rounded-full p-2"
                >
                  <Ionicons name="chevron-forward" size={24} color="white" />
                </TouchableOpacity>
              </>
            )}

            {/* Media counter */}
            {sortedMedia.length > 1 && (
              <View className="absolute top-2 right-2 bg-black bg-opacity-50 px-2 py-1 rounded-full">
                <Text className="text-white text-xs">
                  {activeMediaIndex + 1} / {sortedMedia.length}
                </Text>
              </View>
            )}
          </View>

          {/* Thumbnail navigation for multiple media */}
          {sortedMedia.length > 1 && (
            <FlatList
              data={sortedMedia}
              horizontal
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  onPress={() => setActiveMediaIndex(index)}
                  className={`w-16 h-16 mr-2 rounded-md overflow-hidden border-2 ${
                    index === activeMediaIndex
                      ? "border-blue-500"
                      : "border-transparent"
                  }`}
                >
                  <Image
                    source={{ uri: item.thumbnailUrl || item.url }}
                    style={{ width: "100%", height: "100%" }}
                    contentFit="cover"
                  />
                </TouchableOpacity>
              )}
              keyExtractor={(item, index) => index.toString()}
              contentContainerStyle={{ padding: 8 }}
            />
          )}
        </View>
      )}

      {/* Content */}
      <View className="p-4">
        {post.title && (
          <Text className="text-xl font-bold mb-2">{post.title}</Text>
        )}
        {post.content && <Text className="mb-4">{post.content}</Text>}

        {/* Stats bar */}
        <View className="flex-row justify-between mb-3">
          <Text className="text-xs text-gray-500">{post.viewsCount} views</Text>
          <Text className="text-xs text-gray-500">
            {post.commentsCount} comments
          </Text>
          <Text className="text-xs text-gray-500">{post.likesCount} likes</Text>
        </View>

        {/* Action buttons */}
        <View className="flex-row justify-between items-center border-t border-b border-gray-200 py-2 my-2">
          <TouchableOpacity
            onPress={handleLike}
            className={`flex-row items-center px-2 py-1 rounded-md ${
              post.isLikedByMe ? "bg-blue-50" : ""
            }`}
          >
            <Ionicons
              name={post.isLikedByMe ? "thumbs-up" : "thumbs-up-outline"}
              size={20}
              color={post.isLikedByMe ? "#2563EB" : "#6B7280"}
            />
            <Text
              className={`ml-1 ${
                post.isLikedByMe ? "text-blue-600" : "text-gray-500"
              }`}
            >
              {post.likesCount > 0 ? post.likesCount : "Like"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleDislike}
            className={`flex-row items-center px-2 py-1 rounded-md ${
              post.isDislikedByMe ? "bg-red-50" : ""
            }`}
          >
            <Ionicons
              name={post.isDislikedByMe ? "thumbs-down" : "thumbs-down-outline"}
              size={20}
              color={post.isDislikedByMe ? "#DC2626" : "#6B7280"}
            />
            <Text
              className={`ml-1 ${
                post.isDislikedByMe ? "text-red-600" : "text-gray-500"
              }`}
            >
              {post.dislikesCount > 0 ? post.dislikesCount : "Dislike"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowComments(!showComments)}
            className={`flex-row items-center px-2 py-1 rounded-md ${
              post.isCommentedByMe ? "bg-green-50" : ""
            }`}
          >
            <Ionicons
              name={post.isCommentedByMe ? "chatbubble" : "chatbubble-outline"}
              size={20}
              color={post.isCommentedByMe ? "#10B981" : "#6B7280"}
            />
            <Text
              className={`ml-1 ${
                post.isCommentedByMe ? "text-green-600" : "text-gray-500"
              }`}
            >
              {post.commentsCount > 0 ? post.commentsCount : "Comment"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleShare}
            className={`flex-row items-center px-2 py-1 rounded-md ${
              post.isSharedByMe ? "bg-purple-50" : ""
            }`}
          >
            <Ionicons
              name={post.isSharedByMe ? "share" : "share-outline"}
              size={20}
              color={post.isSharedByMe ? "#7C3AED" : "#6B7280"}
            />
            <Text
              className={`ml-1 ${
                post.isSharedByMe ? "text-purple-600" : "text-gray-500"
              }`}
            >
              Share
            </Text>
          </TouchableOpacity>
        </View>

        {/* Comments section */}
        {showComments && (
          <View className="mt-4">
            {/* Comment form */}
            <View className="mb-4">
              <View className="flex-row items-start space-x-2">
                <View className="flex-shrink-0">
                  {renderAvatar(
                    {
                      id: currentUserId as Guid,
                      username: "",
                      displayName: "You",
                      tag: 0,
                    },
                    "sm"
                  )}
                </View>
                <View className="flex-grow">
                  <TextInput
                    value={commentText}
                    onChangeText={setCommentText}
                    placeholder="Add a comment..."
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    multiline
                    numberOfLines={2}
                  />
                  <View className="flex-row justify-end mt-2">
                    <TouchableOpacity
                      onPress={handleCommentSubmit}
                      className={`px-4 py-1 rounded-full ${
                        commentText.trim() ? "bg-blue-600" : "bg-gray-200"
                      }`}
                      disabled={!commentText.trim()}
                    >
                      <Text
                        className={`text-sm font-medium ${
                          commentText.trim() ? "text-white" : "text-gray-500"
                        }`}
                      >
                        Reply
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>

            {/* Comments list */}
            <FlatList
              data={comments}
              keyExtractor={(item) => item.id}
              renderItem={({ item: comment }) => (
                <View className="flex-row space-x-2 mb-4">
                  <View className="flex-shrink-0">
                    {renderAvatar(users[comment.userId], "sm")}
                  </View>
                  <View className="flex-grow">
                    <View className="bg-gray-50 rounded-lg p-3">
                      <View className="flex-row items-baseline">
                        <Text className="font-bold text-sm">
                          {users[comment.userId]?.displayName || "Unknown User"}
                        </Text>
                        <Text className="ml-2 text-xs text-gray-500">
                          @
                          {users[comment.userId]
                            ? userDisplayName(users[comment.userId])
                            : "unknown"}
                        </Text>
                      </View>
                      <Text className="text-sm mt-1">{comment.content}</Text>
                    </View>
                    <View className="flex-row items-center mt-1 space-x-4">
                      <Text className="text-xs text-gray-500">
                        {format(
                          new Date(comment.createdAt),
                          "MMM d, yyyy - h:mm a"
                        )}
                      </Text>
                      <TouchableOpacity>
                        <Text className="text-xs text-gray-500">Like</Text>
                      </TouchableOpacity>
                      <TouchableOpacity>
                        <Text className="text-xs text-gray-500">Reply</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
              ListEmptyComponent={() => (
                <Text className="text-center text-gray-500 py-4">
                  No comments yet. Be the first to comment!
                </Text>
              )}
              onEndReached={loadMoreComments}
              onEndReachedThreshold={0.1}
              ListFooterComponent={() => (
                <View className="py-2 text-center">
                  {isLoadingComments && (
                    <View className="flex-row justify-center items-center">
                      <ActivityIndicator color="#3B82F6" />
                      <Text className="ml-2 text-sm text-gray-500">
                        Loading more comments...
                      </Text>
                    </View>
                  )}
                  {!hasMoreComments && comments.length > 0 && (
                    <Text className="text-sm text-gray-500">
                      No more comments to load
                    </Text>
                  )}
                </View>
              )}
            />
          </View>
        )}
      </View>
    </View>
  );
}
