"use client";

import PluginStoreHeader from "@/components/plugins/PluginStoreHeader";
import PluginSection from "@/components/plugins/PluginSection";
import SearchBar from "@/components/plugins/SearchBar";
import { PluginAPI } from "@/lib/api/PluginAPI";

export default function PluginStorePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <PluginStoreHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <SearchBar />
        </div>

        <div className="space-y-12">
          <PluginSection
            title="Staff Picks"
            description="Curated plugins recommended by our team"
            fetchFunction={PluginAPI.getStaffPicksPlugins}
            href="staff-picks"
          />

          <PluginSection
            title="Hot Plugins"
            description="Popular plugins trending right now"
            fetchFunction={PluginAPI.getHotPlugins}
            href="hot"
          />

          <PluginSection
            title="New Arrivals"
            description="Recently added plugins to discover"
            fetchFunction={PluginAPI.getNewArrivalsPlugins}
            href="new"
          />

          <PluginSection
            title="Recommended For You"
            description="Personalized recommendations based on your usage"
            fetchFunction={PluginAPI.getRecommendedForYouPlugins}
            href="recommended"
          />
        </div>
      </main>
    </div>
  );
}
