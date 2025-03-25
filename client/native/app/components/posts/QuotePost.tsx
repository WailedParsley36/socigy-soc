import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { Image as ExpoImage } from "expo-image";
import { ResizeMode, Video } from "expo-av";
import { format } from "date-fns";
import { Ionicons } from "@expo/vector-icons";
import { Comment, ContentAPI } from "@/lib/api/ContentHelper";
import {
  MediaType,
  RecommendedPost,
  UserRegistry,
  userDisplayName,
} from "@/lib/structures/content/posts/RecommendedPost";
import { Guid } from "@/lib/structures/Guid";

interface QuotePostProps {
  post: RecommendedPost;
  users: UserRegistry;
  currentUserId: string;
  onLike: (postId: Guid) => void;
  onDislike: (postId: Guid) => void;
  onComment: (postId: Guid, content: string) => void;
  onShare: (postId: Guid) => void;
}

const QuotePost = ({
  post,
  users,
  currentUserId,
  onLike,
  onDislike,
  onComment,
  onShare,
}: QuotePostProps) => {
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState(post.comments || []);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentPage, setCommentPage] = useState(0);
  const [hasMoreComments, setHasMoreComments] = useState(true);

  const handleLike = () => onLike(post.id);
  const handleDislike = () => onDislike(post.id);
  const handleShare = () => onShare(post.id);

  const handleCommentSubmit = () => {
    if (commentText.trim()) {
      onComment(post.id, commentText);
      const newComment: Comment = {
        id: "10852470-cf97-427e-b0af-b57bf015d8c5" as Guid, // TODO: Generate Guid even in FramePost
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

  const getInitials = (name: string) => {
    if (!name) return "?";
    return name
      .replace(" #", "")
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const getAvatarColor = (userId: string) => {
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

  const renderAvatar = (user: any, size: "sm" | "md" | "lg" = "md") => {
    const sizeClasses = {
      sm: "w-8 h-8",
      md: "w-10 h-10",
      lg: "w-12 h-12",
    };

    if (user?.iconUrl) {
      return (
        <ExpoImage
          source={{ uri: user.iconUrl }}
          className={`${sizeClasses[size]} rounded-full`}
          contentFit="cover"
        />
      );
    } else {
      const initials = user?.displayName ? getInitials(user.displayName) : "?";
      const bgColor = getAvatarColor(user?.id || "unknown");

      return (
        <View
          className={`${sizeClasses[size]} ${bgColor} rounded-full items-center justify-center`}
        >
          <Text className="text-white font-bold">{initials}</Text>
        </View>
      );
    }
  };

  return (
    <View className="bg-white rounded-lg p-4 mb-4 shadow">
      {/* Header */}
      <View className="flex-row items-start mb-3">
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

      {/* Content */}
      {post.title && (
        <Text className="text-xl font-bold mb-2">{post.title}</Text>
      )}
      <Text className="mb-4">{post.content}</Text>

      {/* Media */}
      {post.media && post.media.length > 0 && (
        <FlatList
          data={post.media}
          numColumns={2}
          columnWrapperStyle={{ gap: 8 }}
          contentContainerStyle={{ gap: 8 }}
          keyExtractor={(_, index) => index.toString()}
          renderItem={({ item: media }) => (
            <View className="aspect-square flex-1 bg-gray-100 rounded-lg overflow-hidden">
              {media.mediaType === MediaType.Image ? (
                <ExpoImage
                  source={{ uri: media.url }}
                  className="w-full h-full"
                  contentFit="cover"
                />
              ) : media.mediaType === MediaType.Video ? (
                <Video
                  source={{ uri: media.url }}
                  className="w-full h-full"
                  useNativeControls
                  resizeMode={ResizeMode.COVER}
                />
              ) : (
                <View className="flex-1 items-center justify-center bg-gray-200">
                  <Text>Unsupported media type</Text>
                </View>
              )}
            </View>
          )}
        />
      )}

      {/* Stats */}
      <View className="flex-row justify-between mb-3">
        <Text className="text-xs text-gray-500">{post.viewsCount} views</Text>
        <Text className="text-xs text-gray-500">
          {post.totalComments} comments
        </Text>
        <Text className="text-xs text-gray-500">{post.likesCount} likes</Text>
      </View>

      {/* Action Buttons */}
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
            {post.totalComments > 0 ? post.totalComments : "Comment"}
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

      {/* Comments Section */}
      {showComments && (
        <View className="mt-4">
          {/* Comment Input */}
          <View className="mb-4">
            <View className="flex-row items-start space-x-2">
              <View className="flex-shrink-0">
                {renderAvatar({ id: currentUserId, displayName: "You" }, "sm")}
              </View>
              <View className="flex-1">
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

          {/* Comments List */}
          <FlatList
            data={comments}
            keyExtractor={(item) => item.id}
            onEndReached={loadMoreComments}
            onEndReachedThreshold={0.1}
            ListEmptyComponent={() => (
              <Text className="text-center text-gray-500 py-4">
                No comments yet. Be the first to comment!
              </Text>
            )}
            ListFooterComponent={() => (
              <View className="py-2">
                {isLoadingComments && (
                  <View className="flex-row justify-center items-center">
                    <ActivityIndicator color="#3B82F6" />
                    <Text className="ml-2 text-sm text-gray-500">
                      Loading more comments...
                    </Text>
                  </View>
                )}
                {!hasMoreComments && comments.length > 0 && (
                  <Text className="text-center text-sm text-gray-500">
                    No more comments to load
                  </Text>
                )}
              </View>
            )}
            renderItem={({ item: comment }) => (
              <View className="flex-row space-x-2 mb-4">
                <View className="flex-shrink-0">
                  {renderAvatar(users[comment.userId], "sm")}
                </View>
                <View className="flex-1">
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
          />
        </View>
      )}
    </View>
  );
};

export default QuotePost;
