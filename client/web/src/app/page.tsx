"use client";

import LoadingScreen from "@/components/LoadingScreen";
import DisplayPost from "@/components/posts/DisplayPost";
import { PostAPI } from "@/lib/api/PostHelper";
import protectRoute from "@/lib/protectRoute";
import {
  RecommendedPost,
  UserRegistry,
} from "@/lib/structures/content/posts/RecommendedPost";
import useAwaitedAuthStore from "@/stores/AuthStore";
import { redirect, useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

// Navigation item component
interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
}

const NavItem = ({ icon, label, href, active = false }: NavItemProps) => (
  <Link
    href={href}
    className={`flex items-center p-2 rounded-lg transition-colors ${
      active ? "bg-blue-100 text-blue-600" : "text-gray-700 hover:bg-gray-100"
    }`}
  >
    <div className="mr-3">{icon}</div>
    <span className="font-medium">{label}</span>
  </Link>
);

export default function Home() {
  const { isLoaded, auth } = useAwaitedAuthStore();
  const router = useRouter();

  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const [noMorePosts, setNoMorePosts] = useState(false);
  const [loadedUsers, setLoadedUsers] = useState<UserRegistry>({});
  const [loadedPosts, setLoadedPosts] = useState<RecommendedPost[]>([]);
  const [activeTab, setActiveTab] = useState<"foryou" | "following">("foryou");

  // Ref for infinite scrolling
  const observerTarget = useRef(null);

  const handleLoadMorePosts = useCallback(async () => {
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

      setLoadedPosts((prev) => [...prev, ...postResponse.result!.posts]);
      setLoadedUsers((prev) => ({ ...prev, ...postResponse.result!.users }));
    } catch (err) {
      console.error("Failed to load posts:", err);
      setError("Failed to load posts. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }, [loadedPosts.length, isLoading, noMorePosts]);

  // Initial load
  useEffect(() => {
    if (!isLoaded) return;
    handleLoadMorePosts();
  }, [isLoaded, handleLoadMorePosts]);

  // Infinite scroll setup
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading) {
          handleLoadMorePosts();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [handleLoadMorePosts, isLoading]);

  if (!isLoaded) {
    return <LoadingScreen />;
  }

  const redirectTo = protectRoute(auth);
  if (redirectTo) return redirect(redirectTo);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-blue-600">Socigy</h1>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <button className="p-2 rounded-full hover:bg-gray-100">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>
            <button className="p-2 rounded-full hover:bg-gray-100 relative">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                3
              </span>
            </button>
            <button
              onClick={() => router.push("/create")}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
            <button
              onClick={() => router.push("/profile")}
              className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100"
            >
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
                {auth.user?.iconUrl ? (
                  <Image
                    src={auth.user.iconUrl}
                    alt={auth.user.displayName || "Profile"}
                    width={32}
                    height={32}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-blue-600 font-medium">
                    {auth.user?.displayName?.charAt(0) || "U"}
                  </span>
                )}
              </div>
            </button>
          </div>

          <button className="md:hidden p-2 rounded-lg hover:bg-gray-100">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 flex flex-col md:flex-row gap-6">
        {/* Sidebar Navigation - Desktop */}
        <aside className="hidden md:block w-64 space-y-1">
          <NavItem
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
            }
            label="Home"
            href="/"
            active={true}
          />
          <NavItem
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            }
            label="Circles"
            href="/circles"
          />
          <NavItem
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            }
            label="Relationships"
            href="/relationships"
          />
          <NavItem
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            }
            label="Contacts"
            href="/contacts"
          />
          <NavItem
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            }
            label="AI Profiles"
            href="/ai-profiles"
          />
          <NavItem
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"
                />
              </svg>
            }
            label="Plugins"
            href="/plugins"
          />
          <NavItem
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            }
            label="My Page"
            href="/me"
          />
          <NavItem
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            }
            label="Settings"
            href="/settings"
          />
          <div className="pt-4 mt-4 border-t border-gray-200">
            <button
              onClick={async () => await auth.logout()}
              className="flex items-center p-2 w-full text-left rounded-lg text-red-600 hover:bg-red-50"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 mr-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {/* Feed Tabs */}
          <div className="mb-4 border-b border-gray-200">
            <div className="flex space-x-8">
              <button
                onClick={() => setActiveTab("foryou")}
                className={`pb-4 px-1 ${
                  activeTab === "foryou"
                    ? "border-b-2 border-blue-500 text-blue-600 font-medium"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                For You
              </button>
              <button
                onClick={() => setActiveTab("following")}
                className={`pb-4 px-1 ${
                  activeTab === "following"
                    ? "border-b-2 border-blue-500 text-blue-600 font-medium"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Following
              </button>
            </div>
          </div>

          {/* Create Post Quick Access */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex items-center">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden mr-3">
              {auth.user?.iconUrl ? (
                <Image
                  src={auth.user.iconUrl}
                  alt={auth.user.displayName || "Profile"}
                  width={40}
                  height={40}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-blue-600 font-medium">
                  {auth.user?.displayName?.charAt(0) || "U"}
                </span>
              )}
            </div>
            <button
              onClick={() => router.push("/create")}
              className="flex-grow bg-gray-100 hover:bg-gray-200 rounded-full py-2 px-4 text-left text-gray-500"
            >
              What's on your mind?
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
              <p className="text-red-700">{error}</p>
              <button
                onClick={() => {
                  setError(undefined);
                  handleLoadMorePosts();
                }}
                className="mt-2 text-sm font-medium text-red-600 hover:text-red-800"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Posts */}
          <div className="space-y-4">
            {loadedPosts.length > 0 ? (
              loadedPosts.map((post) => (
                <div key={post.id} className="mb-4">
                  <DisplayPost
                    post={post}
                    users={loadedUsers}
                    currentUserId={auth.user!.id}
                  />
                </div>
              ))
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <p className="text-gray-500">No posts to display</p>
                <button
                  onClick={handleLoadMorePosts}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Refresh
                </button>
              </div>
            )}
          </div>

          {/* Loading Indicator for Infinite Scroll */}
          <div
            ref={observerTarget}
            className={`py-4 text-center ${isLoading ? "block" : "hidden"}`}
          >
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
            <p className="text-gray-500 mt-2">Loading more posts...</p>
          </div>
        </main>

        {/* Right Sidebar - Desktop */}
        <aside className="hidden lg:block w-80 space-y-6">
          {/* User Profile Card */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center mb-3">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden mr-3">
                {auth.user?.iconUrl ? (
                  <Image
                    src={auth.user.iconUrl}
                    alt={auth.user.displayName || "Profile"}
                    width={48}
                    height={48}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-blue-600 font-medium">
                    {auth.user?.displayName?.charAt(0) || "U"}
                  </span>
                )}
              </div>
              <div>
                <h3 className="font-medium">
                  {auth.user?.displayName || "User"}
                </h3>
                <p className="text-sm text-gray-500">
                  @{auth.user?.username || "username"}
                </p>
              </div>
            </div>
            <Link
              href="/profile"
              className="block w-full py-2 text-center text-sm text-blue-600 hover:bg-blue-50 rounded-md"
            >
              View Profile
            </Link>
          </div>

          {/* Trending Topics */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="font-medium mb-3">Trending Topics</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="block hover:bg-gray-50 p-2 rounded-md">
                  <span className="text-xs text-gray-500">Technology</span>
                  <p className="font-medium">#NextJS</p>
                  <span className="text-xs text-gray-500">4.2K posts</span>
                </a>
              </li>
              <li>
                <a href="#" className="block hover:bg-gray-50 p-2 rounded-md">
                  <span className="text-xs text-gray-500">Entertainment</span>
                  <p className="font-medium">#FridayVibes</p>
                  <span className="text-xs text-gray-500">2.8K posts</span>
                </a>
              </li>
              <li>
                <a href="#" className="block hover:bg-gray-50 p-2 rounded-md">
                  <span className="text-xs text-gray-500">Science</span>
                  <p className="font-medium">#SpaceExploration</p>
                  <span className="text-xs text-gray-500">1.5K posts</span>
                </a>
              </li>
            </ul>
            <a
              href="#"
              className="block mt-3 text-sm text-blue-600 hover:underline"
            >
              Show more
            </a>
          </div>

          {/* Suggested Connections */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="font-medium mb-3">People to Follow</h3>
            <ul className="space-y-3">
              <li className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden mr-3">
                    <span className="text-purple-600 font-medium">J</span>
                  </div>
                  <div>
                    <p className="font-medium">Jane Smith</p>
                    <p className="text-xs text-gray-500">@janesmith</p>
                  </div>
                </div>
                <button className="px-3 py-1 text-xs text-blue-600 border border-blue-600 rounded-full hover:bg-blue-50">
                  Follow
                </button>
              </li>
              <li className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center overflow-hidden mr-3">
                    <span className="text-green-600 font-medium">M</span>
                  </div>
                  <div>
                    <p className="font-medium">Mark Johnson</p>
                    <p className="text-xs text-gray-500">@markj</p>
                  </div>
                </div>
                <button className="px-3 py-1 text-xs text-blue-600 border border-blue-600 rounded-full hover:bg-blue-50">
                  Follow
                </button>
              </li>
            </ul>
            <a
              href="#"
              className="block mt-3 text-sm text-blue-600 hover:underline"
            >
              Show more
            </a>
          </div>

          {/* Footer */}
          <div className="text-xs text-gray-500">
            <p>© 2025 Socigy. All rights reserved.</p>
            <div className="mt-2 space-x-2">
              <a href="#" className="hover:underline">
                Terms
              </a>
              <a href="#" className="hover:underline">
                Privacy
              </a>
              <a href="#" className="hover:underline">
                Cookies
              </a>
              <a href="#" className="hover:underline">
                Help
              </a>
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10">
        <div className="flex justify-around">
          <Link
            href="/"
            className="flex flex-col items-center py-2 text-blue-600"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            <span className="text-xs">Home</span>
          </Link>
          <Link
            href="/circles"
            className="flex flex-col items-center py-2 text-gray-600"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <span className="text-xs">Circles</span>
          </Link>
          <Link
            href="/create"
            className="flex flex-col items-center py-2 text-gray-600"
          >
            <div className="bg-blue-600 rounded-full p-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
            <span className="text-xs">Create</span>
          </Link>
          <Link
            href="/plugins"
            className="flex flex-col items-center py-2 text-gray-600"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"
              />
            </svg>
            <span className="text-xs">Plugins</span>
          </Link>
          <Link
            href="/me"
            className="flex flex-col items-center py-2 text-gray-600"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span className="text-xs">Profile</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
