"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import DeveloperHeader from "@/components/plugins/dev/DeveloperHeader";
import PluginEditTabs from "@/components/plugins/dev/PluginEditTabs";
import PluginDetailsForm from "@/components/plugins/dev/modals/PluginDetailsForm";
import PluginVersionsPanel from "@/components/plugins/dev/PluginVersionsPanel";
import PluginAssetsPanel from "@/components/plugins/dev/PluginAssetsPanel";
import PluginLocalizationsPanel from "@/components/plugins/dev/PluginLocalizationPanel";
import PluginDatabasePanel from "@/components/plugins/dev/PluginDatabasePanel";
import PluginUserDatabasePanel from "@/components/plugins/dev/PluginUserDatabasePanel";
import PluginLogsPanel from "@/components/plugins/dev/PluginLogsPanel";
import PluginAnalyticsPanel from "@/components/plugins/dev/PluginAnalyticsPanel";
import { useToast } from "@/contexts/ToastContext";
import { PluginRecommendation, PluginAPI } from "@/lib/api/PluginAPI";
import { Guid } from "@/lib/structures/Guid";

export default function PluginEditPage() {
  const { id } = useParams();
  const pluginId = id as unknown as Guid;
  const [plugin, setPlugin] = useState<PluginRecommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("details");
  const { showToast } = useToast();

  useEffect(() => {
    loadPlugin();
  }, [pluginId]);

  const loadPlugin = async () => {
    setLoading(true);
    try {
      const response = await PluginAPI.getPluginDetails(pluginId);
      if (response.result) {
        setPlugin(response.result);
      }
    } catch (error) {
      console.error("Failed to load plugin:", error);
      showToast({
        title: "Error",
        description: "Failed to load plugin details",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSuccess = (updatedPlugin: PluginRecommendation) => {
    setPlugin(updatedPlugin);
    showToast({
      title: "Success",
      description: "Plugin updated successfully",
      type: "success",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <DeveloperHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </main>
      </div>
    );
  }

  if (!plugin) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <DeveloperHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg">
            <h2 className="text-lg font-semibold text-red-800 dark:text-red-400">
              Plugin Not Found
            </h2>
            <p className="text-red-600 dark:text-red-300">
              The requested plugin could not be found or you don't have
              permission to access it.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DeveloperHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {plugin.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {plugin.description || "No description"}
          </p>
        </div>

        <PluginEditTabs activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mt-6 p-6">
          {activeTab === "details" && (
            <PluginDetailsForm
              plugin={plugin}
              onUpdateSuccess={handleUpdateSuccess}
            />
          )}

          {activeTab === "versions" && (
            <PluginVersionsPanel pluginId={pluginId} />
          )}

          {activeTab === "assets" && <PluginAssetsPanel pluginId={pluginId} />}

          {activeTab === "localizations" && (
            <PluginLocalizationsPanel pluginId={pluginId} />
          )}

          {activeTab === "database" && (
            <PluginDatabasePanel pluginId={pluginId} />
          )}

          {activeTab === "userDatabase" && (
            <PluginUserDatabasePanel pluginId={pluginId} />
          )}

          {activeTab === "logs" && <PluginLogsPanel pluginId={pluginId} />}

          {activeTab === "analytics" && (
            <PluginAnalyticsPanel pluginId={pluginId} />
          )}
        </div>
      </main>
    </div>
  );
}
