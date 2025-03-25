import { useToast } from "@/contexts/ToastContext";
import {
  PluginRecommendation,
  PluginAPI,
  PublishStatus,
  VerificationStatus,
} from "@/lib/api/PluginAPI";
import { Guid } from "@/lib/structures/Guid";
import { useState } from "react";

interface PluginListProps {
  plugins: PluginRecommendation[];
  loading: boolean;
  onEdit: (pluginId: string) => void;
  onRefresh: () => void;
}

export default function PluginList({
  plugins,
  loading,
  onEdit,
  onRefresh,
}: PluginListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { showToast } = useToast();

  const handleDelete = async (pluginId: Guid) => {
    if (
      !confirm(
        "Are you sure you want to delete this plugin? This action cannot be undone."
      )
    ) {
      return;
    }

    setDeletingId(pluginId);
    try {
      await PluginAPI.deletePlugin(pluginId);
      showToast({
        title: "Success",
        description: "Plugin deleted successfully",
        type: "success",
      });
      onRefresh();
    } catch (error) {
      console.error("Failed to delete plugin:", error);
      showToast({
        title: "Error",
        description: "Failed to delete plugin",
        type: "error",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (
    status: PublishStatus,
    verificationStatus: VerificationStatus
  ) => {
    switch (status) {
      case PublishStatus.Published:
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            Published
          </span>
        );
      case PublishStatus.Reviewing:
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            Under Review
          </span>
        );
      case PublishStatus.Preparing:
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
            Draft
          </span>
        );
      case PublishStatus.TakenDown:
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            Taken Down
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <div className="animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="border-b border-gray-200 dark:border-gray-700 p-4"
            >
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
              <div className="flex justify-between">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (plugins.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No Plugins Yet
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          You haven't created any plugins yet. Click the "Create New Plugin"
          button to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
      {plugins.map((plugin) => (
        <div
          key={plugin.plugin_id.toString()}
          className="border-b border-gray-200 dark:border-gray-700 last:border-0 p-4"
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                {plugin.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                {plugin.description || "No description"}
              </p>
              <div className="flex flex-wrap gap-2 mb-2">
                {getStatusBadge(
                  plugin.publishStatus,
                  plugin.verificationStatus
                )}

                {plugin.verificationStatus === VerificationStatus.Verified && (
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    Verified
                  </span>
                )}

                <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                  {plugin.installationCount} Installations
                </span>

                <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                  {plugin.reviewCount} Reviews
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Created: {new Date(plugin.createdAt).toLocaleDateString()}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => onEdit(plugin.plugin_id.toString())}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Edit
              </button>

              <button
                onClick={() => handleDelete(plugin.plugin_id)}
                disabled={deletingId === plugin.plugin_id.toString()}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deletingId === plugin.plugin_id.toString()
                  ? "Deleting..."
                  : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
