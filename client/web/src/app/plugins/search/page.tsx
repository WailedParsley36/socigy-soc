// app/plugins/search/page.tsx
"use client";

import LoadingScreen from "@/components/LoadingScreen";
import PluginGrid from "@/components/plugins/PluginGrid";
import SearchBar from "@/components/plugins/SearchBar";
import { PluginAPI } from "@/lib/api/PluginAPI";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

export function PluginSearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams?.get("q") || "";

  const searchPlugins = async (options: any) => {
    return PluginAPI.queryPlugins({
      ...options,
      search: query,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold mb-4">Search Results</h1>
          <p className="text-xl opacity-90 max-w-2xl">
            {query
              ? `Showing results for "${query}"`
              : "Enter a search term to find plugins"}
          </p>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <SearchBar initialQuery={query} />
        </div>

        {query ? (
          <PluginGrid fetchFunction={searchPlugins} />
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              Enter a search term to find plugins
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default function A() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <PluginSearchPage />
    </Suspense>
  );
}
