"use client";

import PluginHeader from "@/components/plugins/PluginHeader";
import PluginDetails from "@/components/plugins/PluginDetails";
import PluginVersions from "@/components/plugins/PluginVersions";
import PluginReviews from "@/components/plugins/PluginReviews";
import { Guid } from "@/lib/structures/Guid";
import { useParams } from "next/navigation";

export default function PluginDetailPage() {
  const { id } = useParams();

  const pluginId = id as Guid;
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <PluginHeader pluginId={pluginId} />

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <PluginDetails pluginId={pluginId} />
            <PluginVersions pluginId={pluginId} />
          </div>

          <div className="lg:col-span-1">
            <PluginReviews pluginId={pluginId} />
          </div>
        </div>
      </main>
    </div>
  );
}
