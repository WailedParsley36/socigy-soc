"use client";

import { PostAPI } from "@/lib/api/PostHelper";
import protectRoute from "@/lib/protectRoute";
import { ContentType } from "@/lib/structures/content/posts/RecommendationRequest";
import useAwaitedAuthStore from "@/stores/AuthStore";
import { redirect, useRouter } from "next/navigation";
import { FormEvent, useCallback, useRef, useState } from "react";
import Link from "next/link";

export default function CreateQuotePage() {
  const { isLoaded, auth } = useAwaitedAuthStore();
  const router = useRouter();

  // States
  const [error, setError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const maxCharCount = 1000;

  // Refs
  const titleRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  // Callbacks
  const handleQuoteSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setError(undefined);
      setIsSubmitting(true);

      try {
        if (!titleRef.current?.value || !contentRef.current?.value) {
          setError("You must fill in both title and content");
          return;
        }

        const result = await PostAPI.uploadPost({
          contentType: ContentType.Quote,
          title: titleRef.current.value,
          content: contentRef.current.value,
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
    },
    [router]
  );

  const handleContentChange = useCallback(() => {
    if (contentRef.current) {
      setCharCount(contentRef.current.value.length);
    }
  }, []);

  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const redirectTo = protectRoute(auth);
  if (redirectTo) return redirect(redirectTo);

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6 flex items-center">
        <Link href="/create" className="mr-3 text-gray-500 hover:text-gray-700">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold">Create a Quote</h1>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <form onSubmit={handleQuoteSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Title
            </label>
            <input
              id="title"
              ref={titleRef}
              type="text"
              minLength={2}
              required
              placeholder="Add a compelling title..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="content"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Content
            </label>
            <textarea
              id="content"
              ref={contentRef}
              minLength={2}
              maxLength={maxCharCount}
              required
              placeholder="Share your thoughts, ideas, or insights..."
              onChange={handleContentChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 min-h-[150px]"
            />
            <div className="mt-1 flex justify-end">
              <span
                className={`text-xs ${
                  charCount > maxCharCount * 0.9
                    ? "text-red-500"
                    : "text-gray-500"
                }`}
              >
                {charCount}/{maxCharCount}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              <p>Your quote will be visible to everyone</p>
            </div>
            <div className="flex space-x-3">
              <Link
                href="/create"
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Posting...
                  </>
                ) : (
                  "Post Quote"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
        <h3 className="text-sm font-medium text-blue-800 mb-2">
          Tips for great quotes
        </h3>
        <ul className="text-sm text-blue-700 list-disc pl-5 space-y-1">
          <li>Keep it concise and meaningful</li>
          <li>Use a compelling title that captures attention</li>
          <li>Add context to help readers understand your perspective</li>
          <li>
            Consider using hashtags in your content for better discoverability
          </li>
        </ul>
      </div>
    </div>
  );
}
