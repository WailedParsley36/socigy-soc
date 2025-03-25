"use client";

import protectRoute from "@/lib/protectRoute";
import { ContentType } from "@/lib/structures/content/posts/RecommendationRequest";
import useAwaitedAuthStore from "@/stores/AuthStore";
import { redirect, useRouter } from "next/navigation";
import { useState } from "react";

// Content type card component
interface ContentTypeCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
}

const ContentTypeCard = ({
  title,
  description,
  icon,
  disabled = false,
  onClick,
}: ContentTypeCardProps) => (
  <div
    className={`relative p-6 rounded-xl border transition-all ${
      disabled
        ? "bg-gray-100 border-gray-200 cursor-not-allowed opacity-60"
        : "bg-white border-gray-200 hover:border-blue-500 hover:shadow-md cursor-pointer"
    }`}
    onClick={disabled ? undefined : onClick}
  >
    <div className="flex items-center mb-3">
      <div className="text-blue-600 mr-3 text-2xl">{icon}</div>
      <h3 className="font-semibold text-lg">{title}</h3>
      {disabled && (
        <span className="absolute top-3 right-3 px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded-full">
          Coming soon
        </span>
      )}
    </div>
    <p className="text-gray-600 text-sm">{description}</p>
  </div>
);

export default function Create() {
  const { isLoaded, auth } = useAwaitedAuthStore();
  const router = useRouter();

  // State for hovering effects
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const redirectTo = protectRoute(auth);
  if (redirectTo) return redirect(redirectTo);

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
          path: "/create/quote",
        },
        {
          id: "frame",
          title: "Frame",
          description:
            "Share photos and images with captions, similar to Instagram posts.",
          icon: <i className="fas fa-image"></i>,
          disabled: false,
          path: "/create/frame",
        },
        {
          id: "take",
          title: "Take",
          description:
            "Create short-form videos similar to TikTok or Instagram Reels.",
          icon: <i className="fas fa-video"></i>,
          disabled: true,
          path: "/create/take",
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
          path: "/create/poll",
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
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Create New Post</h1>
        <p className="text-gray-600">
          Choose the type of content you want to create
        </p>
      </div>

      <div className="space-y-8">
        {contentTypes.map((category) => (
          <div
            key={category.category}
            className="relative"
            onMouseEnter={() => setActiveCategory(category.category)}
            onMouseLeave={() => setActiveCategory(null)}
          >
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              {category.category}
              {category.category !== "Short-form" &&
                category.category !== "Interactive" && (
                  <span className="ml-2 text-xs px-2 py-1 bg-gray-200 text-gray-600 rounded-full">
                    Coming soon
                  </span>
                )}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {category.types.map((type) => (
                <ContentTypeCard
                  key={type.id}
                  title={type.title}
                  description={type.description}
                  icon={type.icon}
                  disabled={type.disabled}
                  onClick={() => router.push(type.path!)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 p-4 bg-blue-50 rounded-lg border border-blue-100">
        <h3 className="text-lg font-medium text-blue-800 mb-2">
          Need help getting started?
        </h3>
        <p className="text-blue-700">
          Check out our{" "}
          <a href="#" className="underline">
            content creation guide
          </a>{" "}
          for tips and best practices on creating engaging content.
        </p>
      </div>
    </div>
  );
}
