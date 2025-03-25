// components/plugins/PluginReviews.tsx
import { useState, useEffect } from "react";
import { PluginAPI, PluginReview } from "@/lib/api/PluginAPI";
import { Guid } from "@/lib/structures/Guid";
import {
  userDisplayName,
  UserShallowInfo,
} from "@/lib/structures/content/posts/RecommendedPost";
import Image from "next/image";

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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Reviews
        </h2>

        {/* Review Form */}
        <div className="mb-6">
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 mb-2">
              Your Rating
            </label>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setUserRating(star)}
                  className="text-2xl focus:outline-none"
                >
                  <span
                    className={`${
                      userRating >= star
                        ? "text-yellow-400"
                        : "text-gray-300 dark:text-gray-600"
                    }`}
                  >
                    ★
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 mb-2">
              Your Review
            </label>
            <textarea
              value={userReview}
              onChange={(e) => setUserReview(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              rows={4}
              placeholder="Share your experience with this plugin..."
            />
          </div>

          <button
            onClick={handleSubmitReview}
            disabled={isSubmitting || !userReview.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Submitting..." : "Submit Review"}
          </button>
        </div>
      </div>

      {/* Reviews List */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {loading ? (
          <div className="p-6 space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center mb-2">
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                  <div className="ml-3 w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                </div>
              </div>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            No reviews yet. Be the first to share your experience!
          </div>
        ) : (
          <div className="max-h-[600px] overflow-y-auto">
            {reviews.map((review) => (
              <div key={review.review_id.toString()} className="p-6">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mr-3 flex items-center justify-center">
                    {review.iconUrl ? (
                      <Image
                        src={review.iconUrl}
                        alt={
                          userDisplayName(review as any as UserShallowInfo) ||
                          "Profile"
                        }
                        width={40}
                        height={40}
                        className="h-full w-full object-cover"
                        unoptimized={true}
                      />
                    ) : (
                      <span className="text-blue-600 font-medium text-lg">
                        {review.username?.charAt(0) || "U"}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {userDisplayName(review as any as UserShallowInfo)}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="ml-auto flex">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={`${
                          i < review.rating
                            ? "text-yellow-400"
                            : "text-gray-300 dark:text-gray-600"
                        }`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>

                <p className="text-gray-700 dark:text-gray-300">
                  {review.reviewText}
                </p>

                <div className="mt-3 flex justify-end">
                  <button className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                    Report
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {reviews.length > 0 && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-center">
          <button className="text-blue-600 dark:text-blue-400 hover:underline">
            View All Reviews
          </button>
        </div>
      )}
    </div>
  );
}
