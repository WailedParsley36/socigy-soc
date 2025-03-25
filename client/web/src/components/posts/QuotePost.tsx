import React, { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
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

const QuotePost: React.FC<QuotePostProps> = ({
  post,
  users,
  currentUserId,
  onLike,
  onDislike,
  onComment,
  onShare,
}) => {
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState(post.comments || []);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentPage, setCommentPage] = useState(0);
  const [hasMoreComments, setHasMoreComments] = useState(true);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const commentObserver = useRef<IntersectionObserver | null>(null);

  const handleLike = () => onLike(post.id);
  const handleDislike = () => onDislike(post.id);
  const handleShare = () => onShare(post.id);

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim()) {
      onComment(post.id, commentText);
      const newComment: Comment = {
        id: crypto.randomUUID() as Guid,
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

  // Set up intersection observer for infinite comment loading
  useEffect(() => {
    if (!showComments) return;

    const options = {
      root: null,
      rootMargin: "0px",
      threshold: 1.0,
    };

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMoreComments && !isLoadingComments) {
        loadMoreComments();
      }
    }, options);

    if (commentsEndRef.current) {
      observer.observe(commentsEndRef.current);
    }

    commentObserver.current = observer;

    return () => {
      if (commentObserver.current) {
        commentObserver.current.disconnect();
      }
    };
  }, [showComments, hasMoreComments, isLoadingComments, comments]);

  // Load initial comments when showing comments section
  useEffect(() => {
    if (showComments && comments.length === 0 && !isLoadingComments) {
      loadMoreComments();
    }
  }, [showComments]);

  const postOwner = users[post.userId];

  // Function to get initials from name
  const getInitials = (name: string) => {
    if (!name) return "?";
    return name
      .replace(" #", "")
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  // Function to generate a color based on user ID for avatar background
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

    // Simple hash function to get consistent color for a user
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }

    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  // Render user avatar with fallback to initials
  const renderAvatar = (user: any, size: "sm" | "md" | "lg" = "md") => {
    const sizeClasses = {
      sm: "w-8 h-8",
      md: "w-10 h-10",
      lg: "w-12 h-12",
    };

    if (user?.iconUrl) {
      return (
        <img
          src={user.iconUrl}
          alt={user.displayName || "User"}
          className={`${sizeClasses[size]} rounded-full object-cover`}
        />
      );
    } else {
      const initials = user?.displayName ? getInitials(user.displayName) : "?";
      const bgColor = getAvatarColor(user?.id || "unknown");

      return (
        <div
          className={`${sizeClasses[size]} ${bgColor} rounded-full flex items-center justify-center text-white font-bold`}
        >
          {initials}
        </div>
      );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4 transition-all hover:shadow-md">
      <div className="flex items-start mb-3">
        <div className="mr-3">{renderAvatar(postOwner)}</div>
        <div className="flex-1">
          <div className="flex items-baseline">
            <p className="font-bold">
              {postOwner?.displayName || "Unknown User"}
            </p>
            <p className="ml-2 text-sm text-gray-500">
              @{userDisplayName(postOwner)}
            </p>
          </div>
          <p className="text-xs text-gray-500">
            {post.updatedAt || post.scheduledAt
              ? format(
                  new Date(post.updatedAt || post.scheduledAt!),
                  "MMM d, yyyy • h:mm a"
                )
              : "Unknown date"}
          </p>
        </div>
      </div>

      {post.title && <h2 className="text-xl font-bold mb-2">{post.title}</h2>}
      <p className="mb-4 whitespace-pre-line">{post.content}</p>

      {/* Media rendering */}
      {post.media && post.media.length > 0 && (
        <div
          className={`grid ${
            post.media.length === 1 ? "grid-cols-1" : "grid-cols-2"
          } gap-2 mb-4`}
        >
          {post.media.map((media, index) => (
            <div
              key={index}
              className="relative rounded-lg overflow-hidden bg-gray-100"
            >
              {media.mediaType == MediaType.Image ? ( // Image
                <img
                  src={media.url}
                  alt="Post media"
                  className="w-full h-full object-cover"
                />
              ) : media.mediaType == MediaType.Video ? ( // Video
                <video
                  src={media.url}
                  controls
                  poster={media.thumbnailUrl}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-40 bg-gray-200">
                  <span>Unsupported media type</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* External URL */}
      {post.externalUrl && (
        <a
          href={post.externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block mb-4 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center text-blue-600">
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
            {post.externalUrl}
          </div>
        </a>
      )}

      {/* Stats bar */}
      <div className="flex text-xs text-gray-500 mb-3 space-x-4">
        <span>{post.viewsCount} views</span>
        <span>{post.totalComments} comments</span>
        <span>{post.likesCount} likes</span>
      </div>

      {/* Action buttons */}
      <div className="flex justify-between items-center border-t border-b border-gray-200 py-2 my-2">
        <button
          onClick={handleLike}
          className={`flex items-center px-2 py-1 rounded-md transition-colors ${
            post.isLikedByMe
              ? "text-blue-600 bg-blue-50"
              : "text-gray-500 hover:bg-gray-100"
          }`}
        >
          <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
          </svg>
          <span>{post.likesCount > 0 ? post.likesCount : "Like"}</span>
        </button>
        <button
          onClick={handleDislike}
          className={`flex items-center px-2 py-1 rounded-md transition-colors ${
            post.isDislikedByMe
              ? "text-red-600 bg-red-50"
              : "text-gray-500 hover:bg-gray-100"
          }`}
        >
          <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.43a2 2 0 00-1.105-1.79l-.05-.025A4 4 0 0011.055 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.866a4 4 0 00.8-2.4z" />
          </svg>
          <span>{post.dislikesCount > 0 ? post.dislikesCount : "Dislike"}</span>
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className={`flex items-center px-2 py-1 rounded-md transition-colors ${
            post.isCommentedByMe
              ? "text-green-600 bg-green-50"
              : "text-gray-500 hover:bg-gray-100"
          }`}
        >
          <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z"
              clipRule="evenodd"
            />
          </svg>
          <span>{post.totalComments > 0 ? post.totalComments : "Comment"}</span>
        </button>
        <button
          onClick={handleShare}
          className={`flex items-center px-2 py-1 rounded-md transition-colors ${
            post.isSharedByMe
              ? "text-purple-600 bg-purple-50"
              : "text-gray-500 hover:bg-gray-100"
          }`}
        >
          <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
          </svg>
          <span>Share</span>
        </button>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="mt-4">
          {/* Comment form */}
          <form onSubmit={handleCommentSubmit} className="mb-4">
            <div className="flex items-start space-x-2">
              <div className="flex-shrink-0">
                {renderAvatar({ id: currentUserId, displayName: "You" }, "sm")}
              </div>
              <div className="flex-grow">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={2}
                />
                <div className="flex justify-end mt-2">
                  <button
                    type="submit"
                    className={`px-4 py-1 rounded-full text-sm font-medium ${
                      commentText.trim()
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-gray-200 text-gray-500 cursor-not-allowed"
                    }`}
                    disabled={!commentText.trim()}
                  >
                    Reply
                  </button>
                </div>
              </div>
            </div>
          </form>

          {/* Comments list */}
          <div className="space-y-4">
            {comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment.id} className="flex space-x-2">
                  <div className="flex-shrink-0">
                    {renderAvatar(users[comment.userId], "sm")}
                  </div>
                  <div className="flex-grow">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-baseline">
                        <p className="font-bold text-sm">
                          {users[comment.userId]?.displayName || "Unknown User"}
                        </p>
                        <p className="ml-2 text-xs text-gray-500">
                          @
                          {users[comment.userId]
                            ? userDisplayName(users[comment.userId])
                            : "unknown"}
                        </p>
                      </div>
                      <p className="text-sm mt-1">{comment.content}</p>
                    </div>
                    <div className="flex items-center mt-1 space-x-4 text-xs text-gray-500">
                      <span>
                        {format(
                          new Date(comment.createdAt),
                          "MMM d, yyyy • h:mm a"
                        )}
                      </span>
                      <button className="hover:text-blue-600">Like</button>
                      <button className="hover:text-blue-600">Reply</button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-4">
                No comments yet. Be the first to comment!
              </p>
            )}

            {/* Loading indicator and intersection observer target */}
            <div ref={commentsEndRef} className="py-2 text-center">
              {isLoadingComments && (
                <div className="flex justify-center items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
                  <span className="ml-2 text-sm text-gray-500">
                    Loading more comments...
                  </span>
                </div>
              )}
              {!hasMoreComments && comments.length > 0 && (
                <p className="text-sm text-gray-500">
                  No more comments to load
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotePost;
