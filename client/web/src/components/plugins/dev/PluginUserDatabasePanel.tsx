import { useToast } from "@/contexts/ToastContext";
import { CheckPluginDbStatsResponse, PluginAPI } from "@/lib/api/PluginAPI";
import { Guid } from "@/lib/structures/Guid";
import { useState, useEffect } from "react";

interface PluginUserDatabasePanelProps {
  pluginId: Guid;
}

export default function PluginUserDatabasePanel({
  pluginId,
}: PluginUserDatabasePanelProps) {
  const [stats, setStats] = useState<CheckPluginDbStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    loadStats();
  }, [pluginId]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const response = await PluginAPI.getPluginUserStorageLimits(pluginId);
      if (response.result) {
        setStats(response.result);
      }
    } catch (error) {
      console.error("Failed to load user database stats:", error);
      showToast({
        title: "Error",
        description: "Failed to load user database stats",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAllUserData = async () => {
    if (
      !confirm(
        "Are you sure you want to delete ALL user data? This action cannot be undone and will affect all users of your plugin."
      )
    ) {
      return;
    }

    try {
      await PluginAPI.deletePluginUserAllDbKeys(pluginId);

      showToast({
        title: "Success",
        description: "All user data deleted successfully",
        type: "success",
      });

      loadStats();
    } catch (error) {
      console.error("Failed to delete all user data:", error);
      showToast({
        title: "Error",
        description: "Failed to delete all user data",
        type: "error",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          User Database
        </h2>
        <button
          onClick={handleDeleteAllUserData}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Delete All User Data
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
        <p className="text-gray-700 dark:text-gray-300 mb-6">
          The user database allows your plugin to store data specific to each
          user. This data is automatically managed by the system and is only
          accessible through the plugin API.
        </p>

        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
          </div>
        ) : stats ? (
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Storage Usage
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rows
                </h4>
                <div className="bg-gray-100 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-blue-600 h-4"
                    style={{
                      width: `${(stats.totalRows / stats.rowMaxLimit) * 100}%`,
                    }}
                  ></div>
                </div>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {stats.totalRows} of {stats.rowMaxLimit} rows used (
                  {((stats.totalRows / stats.rowMaxLimit) * 100).toFixed(1)}%)
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Storage Size
                </h4>
                <div className="bg-gray-100 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-green-600 h-4"
                    style={{
                      width: `${
                        (stats.occupiedSize / stats.sizeMaxLimit) * 100
                      }%`,
                    }}
                  ></div>
                </div>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {formatBytes(stats.occupiedSize)} of{" "}
                  {formatBytes(stats.sizeMaxLimit)} used (
                  {((stats.occupiedSize / stats.sizeMaxLimit) * 100).toFixed(1)}
                  %)
                </p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center">
            No storage information available
          </p>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          User Data Management
        </h3>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          User data is managed per-user and can only be accessed by your plugin
          when the specific user is using it. This ensures data privacy and
          security.
        </p>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-2">
            Important Note
          </h4>
          <p className="text-sm text-yellow-700 dark:text-yellow-400">
            Individual user data entries cannot be viewed or edited from this
            dashboard for privacy reasons. You can only manage them
            programmatically through your plugin code using the Plugin API.
          </p>
        </div>
      </div>
    </div>
  );
}

// Helper function to format bytes
function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}
