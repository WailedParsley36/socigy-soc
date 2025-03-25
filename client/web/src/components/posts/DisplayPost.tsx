import React, { useState, useCallback, useEffect, useRef } from "react";
import { ContentType } from "@/lib/structures/content/posts/RecommendationRequest";
import {
  RecommendedPost,
  UserRegistry,
} from "@/lib/structures/content/posts/RecommendedPost";
import QuotePost from "./QuotePost";
import FramePost from "./FramePost";
import { Guid } from "@/lib/structures/Guid";
import { ContentAPI, InteractionType } from "@/lib/api/ContentHelper";

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
  const postRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [viewStartTime, setViewStartTime] = useState<number | null>(null);
  const [totalViewTime, setTotalViewTime] = useState(0);
  const [hasRegisteredView, setHasRegisteredView] = useState(false);

  const handleLike = useCallback(
    async (postId: string) => {
      // If already liked, remove the like
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
          // Revert optimistic update on error
          setPost((prevPost) => ({
            ...prevPost,
            likesCount: prevPost.likesCount + 1,
            isLikedByMe: true,
          }));
        }
      }
      // If already disliked, remove dislike and add like
      else if (post.isDislikedByMe) {
        setPost((prevPost) => ({
          ...prevPost,
          likesCount: prevPost.likesCount + 1,
          isLikedByMe: true,
          dislikesCount: prevPost.dislikesCount - 1,
          isDislikedByMe: false,
        }));

        try {
          // Remove dislike first
          await ContentAPI.removeInteraction({
            postId: postId as Guid,
            type: InteractionType.Dislike,
          });

          // Then add like
          await ContentAPI.addInteraction({
            postId: postId as Guid,
            type: InteractionType.Like,
          });
        } catch (error) {
          console.error("Failed to switch from dislike to like:", error);
          // Revert optimistic update on error
          setPost((prevPost) => ({
            ...prevPost,
            likesCount: prevPost.likesCount - 1,
            isLikedByMe: false,
            dislikesCount: prevPost.dislikesCount + 1,
            isDislikedByMe: true,
          }));
        }
      }
      // If neither liked nor disliked, add like
      else {
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
          // Revert optimistic update on error
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
      // If already disliked, remove the dislike
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
          // Revert optimistic update on error
          setPost((prevPost) => ({
            ...prevPost,
            dislikesCount: prevPost.dislikesCount + 1,
            isDislikedByMe: true,
          }));
        }
      }
      // If already liked, remove like and add dislike
      else if (post.isLikedByMe) {
        setPost((prevPost) => ({
          ...prevPost,
          dislikesCount: prevPost.dislikesCount + 1,
          isDislikedByMe: true,
          likesCount: prevPost.likesCount - 1,
          isLikedByMe: false,
        }));

        try {
          // Remove like first
          await ContentAPI.removeInteraction({
            postId: postId as Guid,
            type: InteractionType.Like,
          });

          // Then add dislike
          await ContentAPI.addInteraction({
            postId: postId as Guid,
            type: InteractionType.Dislike,
          });
        } catch (error) {
          console.error("Failed to switch from like to dislike:", error);
          // Revert optimistic update on error
          setPost((prevPost) => ({
            ...prevPost,
            dislikesCount: prevPost.dislikesCount - 1,
            isDislikedByMe: false,
            likesCount: prevPost.likesCount + 1,
            isLikedByMe: true,
          }));
        }
      }
      // If neither liked nor disliked, add dislike
      else {
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
          // Revert optimistic update on error
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
    // Optimistically update comment count
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
      // Revert optimistic update on error
      setPost((prevPost) => ({
        ...prevPost,
        totalComments: prevPost.totalComments - 1,
        isCommentedByMe: prevPost.totalComments > 1, // Only set to false if this was the only comment
      }));
    }
  }, []);

  const handleShare = useCallback(
    async (postId: string) => {
      // Don't allow sharing again if already shared
      if (post.isSharedByMe) return;

      setPost((prevPost) => ({
        ...prevPost,
        sharesCount: (prevPost.sharesCount || 0) + 1,
        isSharedByMe: true,
      }));

      try {
        await ContentAPI.addInteraction({
          postId: postId as Guid,
          type: InteractionType.Share,
        });
      } catch (error) {
        console.error("Failed to share post:", error);
        // Revert optimistic update on error
        setPost((prevPost) => ({
          ...prevPost,
          sharesCount: (prevPost.sharesCount || 1) - 1,
          isSharedByMe: false,
        }));
      }
    },
    [post.isSharedByMe]
  );

  // Register view when post becomes visible
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

  // Track view time
  useEffect(() => {
    if (isVisible && !viewStartTime) {
      setViewStartTime(Date.now());
    } else if (!isVisible && viewStartTime) {
      const viewDuration = (Date.now() - viewStartTime) / 1000; // Convert to seconds
      setTotalViewTime((prev) => prev + viewDuration);
      setViewStartTime(null);

      // Call the callback if provided
      if (onViewTimeUpdate) {
        onViewTimeUpdate(post.id, totalViewTime + viewDuration);
      }
    }
  }, [isVisible, viewStartTime, post.id, totalViewTime, onViewTimeUpdate]);

  // Update view time when component unmounts
  useEffect(() => {
    return () => {
      if (viewStartTime) {
        const finalViewDuration = (Date.now() - viewStartTime) / 1000;
        const finalTotalTime = totalViewTime + finalViewDuration;

        // Send final view time to server
        ContentAPI.addInteraction({
          postId: post.id as Guid,
          type: InteractionType.View,
          viewSeconds: finalTotalTime,
        }).catch((error) => {
          console.error("Failed to update view time:", error);
        });

        if (onViewTimeUpdate) {
          onViewTimeUpdate(post.id, finalTotalTime);
        }
      }
    };
  }, [post.id, viewStartTime, totalViewTime, onViewTimeUpdate]);

  // Set up Intersection Observer to detect when post is visible
  useEffect(() => {
    if (!postRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        setIsVisible(entry.isIntersecting);

        if (entry.isIntersecting && !hasRegisteredView) {
          registerView(post.id);
        }
      },
      {
        threshold: 0.5, // Consider visible when 50% of the post is in viewport
        rootMargin: "0px",
      }
    );

    observer.observe(postRef.current);

    return () => {
      if (postRef.current) {
        observer.unobserve(postRef.current);
      }
    };
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

  return <div ref={postRef}>{renderPost()}</div>;
}
