import React, { useState, useCallback, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { ContentType } from "@/lib/structures/content/posts/RecommendationRequest";
import {
  RecommendedPost,
  UserRegistry,
} from "@/lib/structures/content/posts/RecommendedPost";
import QuotePost from "./QuotePost";
import FramePost from "./FramePost";
import { Guid } from "@/lib/structures/Guid";
import { ContentAPI, InteractionType } from "@/lib/api/ContentHelper";
import Share from "react-native-share";

interface DisplayPostProps {
  post: RecommendedPost;
  users: UserRegistry;
  currentUserId: string;
  onViewTimeUpdate?: (postId: string, seconds: number) => void;
}

export default function DisplayPost({
  post: initialPost,
  users,
  currentUserId,
  onViewTimeUpdate,
}: DisplayPostProps) {
  const [post, setPost] = useState(initialPost);
  const [isVisible, setIsVisible] = useState(false);
  const [viewStartTime, setViewStartTime] = useState<number | null>(null);
  const [totalViewTime, setTotalViewTime] = useState(0);
  const [hasRegisteredView, setHasRegisteredView] = useState(false);

  const handleLike = useCallback(
    async (postId: string) => {
      if (post.isLikedByMe) {
        setPost((prevPost) => ({
          ...prevPost,
          likesCount: prevPost.likesCount - 1,
          isLikedByMe: false,
        }));

        try {
          await ContentAPI.removeInteraction({
            postId: postId as Guid,
            type: InteractionType.Like,
          });
        } catch (error) {
          console.error("Failed to remove like:", error);
          setPost((prevPost) => ({
            ...prevPost,
            likesCount: prevPost.likesCount + 1,
            isLikedByMe: true,
          }));
        }
      } else if (post.isDislikedByMe) {
        setPost((prevPost) => ({
          ...prevPost,
          likesCount: prevPost.likesCount + 1,
          isLikedByMe: true,
          dislikesCount: prevPost.dislikesCount - 1,
          isDislikedByMe: false,
        }));

        try {
          await ContentAPI.removeInteraction({
            postId: postId as Guid,
            type: InteractionType.Dislike,
          });
          await ContentAPI.addInteraction({
            postId: postId as Guid,
            type: InteractionType.Like,
          });
        } catch (error) {
          console.error("Failed to switch from dislike to like:", error);
          setPost((prevPost) => ({
            ...prevPost,
            likesCount: prevPost.likesCount - 1,
            isLikedByMe: false,
            dislikesCount: prevPost.dislikesCount + 1,
            isDislikedByMe: true,
          }));
        }
      } else {
        setPost((prevPost) => ({
          ...prevPost,
          likesCount: prevPost.likesCount + 1,
          isLikedByMe: true,
        }));

        try {
          await ContentAPI.addInteraction({
            postId: postId as Guid,
            type: InteractionType.Like,
          });
        } catch (error) {
          console.error("Failed to add like:", error);
          setPost((prevPost) => ({
            ...prevPost,
            likesCount: prevPost.likesCount - 1,
            isLikedByMe: false,
          }));
        }
      }
    },
    [post.isLikedByMe, post.isDislikedByMe]
  );

  const handleDislike = useCallback(
    async (postId: string) => {
      if (post.isDislikedByMe) {
        setPost((prevPost) => ({
          ...prevPost,
          dislikesCount: prevPost.dislikesCount - 1,
          isDislikedByMe: false,
        }));

        try {
          await ContentAPI.removeInteraction({
            postId: postId as Guid,
            type: InteractionType.Dislike,
          });
        } catch (error) {
          console.error("Failed to remove dislike:", error);
          setPost((prevPost) => ({
            ...prevPost,
            dislikesCount: prevPost.dislikesCount + 1,
            isDislikedByMe: true,
          }));
        }
      } else if (post.isLikedByMe) {
        setPost((prevPost) => ({
          ...prevPost,
          dislikesCount: prevPost.dislikesCount + 1,
          isDislikedByMe: true,
          likesCount: prevPost.likesCount - 1,
          isLikedByMe: false,
        }));

        try {
          await ContentAPI.removeInteraction({
            postId: postId as Guid,
            type: InteractionType.Like,
          });
          await ContentAPI.addInteraction({
            postId: postId as Guid,
            type: InteractionType.Dislike,
          });
        } catch (error) {
          console.error("Failed to switch from like to dislike:", error);
          setPost((prevPost) => ({
            ...prevPost,
            dislikesCount: prevPost.dislikesCount - 1,
            isDislikedByMe: false,
            likesCount: prevPost.likesCount + 1,
            isLikedByMe: true,
          }));
        }
      } else {
        setPost((prevPost) => ({
          ...prevPost,
          dislikesCount: prevPost.dislikesCount + 1,
          isDislikedByMe: true,
        }));

        try {
          await ContentAPI.addInteraction({
            postId: postId as Guid,
            type: InteractionType.Dislike,
          });
        } catch (error) {
          console.error("Failed to add dislike:", error);
          setPost((prevPost) => ({
            ...prevPost,
            dislikesCount: prevPost.dislikesCount - 1,
            isDislikedByMe: false,
          }));
        }
      }
    },
    [post.isLikedByMe, post.isDislikedByMe]
  );

  const handleComment = useCallback(async (postId: string, content: string) => {
    setPost((prevPost) => ({
      ...prevPost,
      totalComments: prevPost.totalComments + 1,
      isCommentedByMe: true,
    }));

    try {
      const result = await ContentAPI.addComment({
        postId: postId as Guid,
        content,
      });

      if (!result.result) {
        throw new Error("Failed to add comment");
      }
    } catch (error) {
      console.error("Failed to add comment:", error);
      setPost((prevPost) => ({
        ...prevPost,
        totalComments: prevPost.totalComments - 1,
        isCommentedByMe: prevPost.totalComments > 1,
      }));
    }
  }, []);

  const handleShare = useCallback(
    async (postId: string) => {
      if (post.isSharedByMe) return;

      try {
        const result = await Share.open({
          message: "Check out this post!",
          url: `https://socigy.com/posts/${postId}`,
          title: "Share Post",
        });

        if (result.success) {
          setPost((prevPost) => ({
            ...prevPost,
            sharesCount: (prevPost.sharesCount || 0) + 1,
            isSharedByMe: true,
          }));

          await ContentAPI.addInteraction({
            postId: postId as Guid,
            type: InteractionType.Share,
          });
        }
      } catch (error) {
        console.error("Failed to share post:", error);
      }
    },
    [post.isSharedByMe]
  );

  const registerView = useCallback(
    async (postId: string) => {
      if (hasRegisteredView) return;

      try {
        await ContentAPI.addInteraction({
          postId: postId as Guid,
          type: InteractionType.View,
        });
        setHasRegisteredView(true);
      } catch (error) {
        console.error("Failed to register view:", error);
      }
    },
    [hasRegisteredView]
  );

  useEffect(() => {
    if (isVisible && !viewStartTime) {
      setViewStartTime(Date.now());
    } else if (!isVisible && viewStartTime) {
      const viewDuration = (Date.now() - viewStartTime) / 1000;
      setTotalViewTime((prev) => prev + viewDuration);
      setViewStartTime(null);

      if (onViewTimeUpdate) {
        onViewTimeUpdate(post.id, totalViewTime + viewDuration);
      }
    }
  }, [isVisible, viewStartTime, post.id, totalViewTime, onViewTimeUpdate]);

  useEffect(() => {
    return () => {
      if (viewStartTime) {
        const finalViewDuration = (Date.now() - viewStartTime) / 1000;
        const finalTotalTime = totalViewTime + finalViewDuration;

        ContentAPI.addInteraction({
          postId: post.id as Guid,
          type: InteractionType.View,
          viewSeconds: finalTotalTime,
        }).catch((error: any) => {
          console.error("Failed to update view time:", error);
        });

        if (onViewTimeUpdate) {
          onViewTimeUpdate(post.id, finalTotalTime);
        }
      }
    };
  }, [post.id, viewStartTime, totalViewTime, onViewTimeUpdate]);

  useEffect(() => {
    setIsVisible(true);
    if (!hasRegisteredView) {
      registerView(post.id);
    }
    return () => setIsVisible(false);
  }, [post.id, hasRegisteredView, registerView]);

  const renderPost = () => {
    const props = {
      post,
      users,
      currentUserId,
      onLike: handleLike,
      onDislike: handleDislike,
      onComment: handleComment,
      onShare: handleShare,
    };

    switch (post.contentType) {
      case ContentType.Quote:
        return <QuotePost {...props} />;
      case ContentType.Frame:
        return <FramePost {...props} />;
      default:
        return null;
    }
  };

  return <View>{renderPost()}</View>;
}
