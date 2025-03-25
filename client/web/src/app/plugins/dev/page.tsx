"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DeveloperHeader from "@/components/plugins/dev/DeveloperHeader";
import PluginList from "@/components/plugins/dev/PluginList";
import CreatePluginModal from "@/components/plugins/dev/modals/CreatePluginModal";
import { useToast } from "@/contexts/ToastContext";
import {
  PluginRecommendation,
  PluginAPI,
  PublishStatus,
  VerificationStatus,
} from "@/lib/api/PluginAPI";
import useAwaitedAuthStore, { useAuthStore } from "@/stores/AuthStore";

export default function PluginDeveloperDashboard() {
  const [plugins, setPlugins] = useState<PluginRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { showToast } = useToast();
  const router = useRouter();
  const { isLoaded, auth } = useAwaitedAuthStore();

  useEffect(() => {
    if (!isLoaded) return;
    loadPlugins();
  }, [isLoaded]);

  const loadPlugins = async () => {
    setLoading(true);
    try {
      const response = await PluginAPI.queryPlugins({
        ownerId: auth.user!.id,
        publishStatuses: [
          PublishStatus.Preparing,
          PublishStatus.Published,
          PublishStatus.Reviewing,
          PublishStatus.TakenDown,
        ],
        minVerificationStatuses: [
          VerificationStatus.Malicious,
          VerificationStatus.Pending,
          VerificationStatus.Unverified,
          VerificationStatus.Verified,
        ],
        limit: 50,
      });

      if (response.result) {
        setPlugins(response.result);
      }
    } catch (error) {
      console.error("Failed to load plugins:", error);
      showToast({
        title: "Error",
        description: "Failed to load your plugins",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSuccess = (plugin: PluginRecommendation) => {
    showToast({
      title: "Success",
      description: "Plugin created successfully",
      type: "success",
    });
    setShowCreateModal(false);
    setPlugins((prev) => [plugin, ...prev]);
  };

  const handleEditPlugin = (pluginId: string) => {
    router.push(`/plugins/dev/${pluginId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DeveloperHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Your Plugins
          </h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Create New Plugin
          </button>
        </div>

        <PluginList
          plugins={plugins}
          loading={loading}
          onEdit={handleEditPlugin}
          onRefresh={loadPlugins}
        />
      </main>

      <CreatePluginModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}
