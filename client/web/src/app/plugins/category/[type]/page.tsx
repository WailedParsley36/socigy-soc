// app/plugins/category/[type]/page.tsx
"use client";

import LoadingScreen from "@/components/LoadingScreen";
import PluginGrid from "@/components/plugins/PluginGrid";
import SearchBar from "@/components/plugins/SearchBar";
import { PluginAPI } from "@/lib/api/PluginAPI";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";

export function PluginCategoryPage() {
  const { type: categoryType } = useParams();

  let title = "Plugins";
  let description = "Browse all available plugins";
  let fetchFunction;

  switch (categoryType) {
    case "hot":
      title = "Hot Plugins";
      description = "Popular plugins trending right now";
      fetchFunction = PluginAPI.getHotPlugins;
      break;
    case "new":
      title = "New Arrivals";
      description = "Recently added plugins to discover";
      fetchFunction = PluginAPI.getNewArrivalsPlugins;
      break;
    case "staff-picks":
      title = "Staff Picks";
      description = "Curated plugins recommended by our team";
      fetchFunction = PluginAPI.getStaffPicksPlugins;
      break;
    case "recommended":
      title = "Recommended For You";
      description = "Personalized recommendations based on your usage";
      fetchFunction = PluginAPI.getRecommendedForYouPlugins;
      break;
    default:
      fetchFunction = PluginAPI.queryPlugins;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold mb-4">{title}</h1>
          <p className="text-xl opacity-90 max-w-2xl">{description}</p>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <SearchBar />
        </div>

        <PluginGrid fetchFunction={fetchFunction} />
      </main>
    </div>
  );
}

export default function A() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <PluginCategoryPage />
    </Suspense>
  );
}
