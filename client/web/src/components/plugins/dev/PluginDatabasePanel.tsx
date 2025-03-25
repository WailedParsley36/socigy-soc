import { useToast } from "@/contexts/ToastContext";
import {
  PluginDbDataRowResponse,
  CheckPluginDbStatsResponse,
  PluginAPI,
  AddPluginDbKeyRequest,
} from "@/lib/api/PluginAPI";
import { Guid } from "@/lib/structures/Guid";
import { useState, useEffect } from "react";

interface PluginDatabasePanelProps {
  pluginId: Guid;
}

export default function PluginDatabasePanel({
  pluginId,
}: PluginDatabasePanelProps) {
  const [dbKeys, setDbKeys] = useState<PluginDbDataRowResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<CheckPluginDbStatsResponse | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [removeAtUninstall, setRemoveAtUninstall] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const limit = 10;
  const { showToast } = useToast();

  useEffect(() => {
    loadDbKeys();
    loadDbStats();
  }, [pluginId, page]);

  const loadDbKeys = async () => {
    setLoading(true);
    try {
      const offset = (page - 1) * limit;
      const response = await PluginAPI.listPluginDbKeys(
        pluginId,
        limit,
        offset
      );
      if (response.result) {
        setDbKeys(response.result);
        setHasMore(response.result.length === limit);
      }
    } catch (error) {
      console.error("Failed to load database keys:", error);
      showToast({
        title: "Error",
        description: "Failed to load database keys",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadDbStats = async () => {
    try {
      const response = await PluginAPI.getPluginStorageLimits(pluginId);
      if (response.result) {
        setStats(response.result);
      }
    } catch (error) {
      console.error("Failed to load database stats:", error);
    }
  };

  const handleAddKey = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newKey.trim()) {
      showToast({
        title: "Validation Error",
        description: "Key is required",
        type: "error",
      });
      return;
    }

    if (!newValue.trim()) {
      showToast({
        title: "Validation Error",
        description: "Value is required",
        type: "error",
      });
      return;
    }

    setSubmitting(true);
    try {
      const data: AddPluginDbKeyRequest = {
        data: newValue,
        removeAtUninstall,
      };

      await PluginAPI.addPluginDbKeyDetails(pluginId, newKey, data);

      showToast({
        title: "Success",
        description: "Key added successfully",
        type: "success",
      });

      setNewKey("");
      setNewValue("");
      setShowAddForm(false);
      loadDbKeys();
      loadDbStats();
    } catch (error) {
      console.error("Failed to add key:", error);
      showToast({
        title: "Error",
        description: "Failed to add key",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteKey = async (key: string) => {
    if (
      !confirm(
        `Are you sure you want to delete the key "${key}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await PluginAPI.deletePluginDbKey(pluginId, key);

      showToast({
        title: "Success",
        description: "Key deleted successfully",
        type: "success",
      });

      loadDbKeys();
      loadDbStats();
    } catch (error) {
      console.error("Failed to delete key:", error);
      showToast({
        title: "Error",
        description: "Failed to delete key",
        type: "error",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Plugin Database
        </h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Add New Key
        </button>
      </div>

      {stats && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
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
                {((stats.occupiedSize / stats.sizeMaxLimit) * 100).toFixed(1)}%)
              </p>
            </div>
          </div>
        </div>
      )}

      {showAddForm && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Add New Key
          </h3>
          <form onSubmit={handleAddKey} className="space-y-4">
            <div>
              <label
                htmlFor="newKey"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Key *
              </label>
              <input
                type="text"
                id="newKey"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
            <div>
              <label
                htmlFor="newValue"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Value *
              </label>
              <textarea
                id="newValue"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                rows={4}
                className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                required
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Enter JSON or plain text value
              </p>
            </div>
            {/* // TODO: Remove */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="removeAtUninstall"
                checked={removeAtUninstall}
                onChange={(e) => setRemoveAtUninstall(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="removeAtUninstall"
                className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
              >
                Remove at uninstall
              </label>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Adding..." : "Add Key"}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-20 bg-gray-200 dark:bg-gray-700 rounded"
            ></div>
          ))}
        </div>
      ) : dbKeys.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm text-center">
          <p className="text-gray-500 dark:text-gray-400">
            No database keys found. Add your first key to store data for your
            plugin.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-750">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Key
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Value
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Created At
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {dbKeys.map((row) => (
                <tr key={row.key}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {row.key}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                    <div className="max-h-24 overflow-y-auto">
                      <pre className="whitespace-pre-wrap break-words">
                        {JSON.stringify(row.data, null, 2)}
                      </pre>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {row.createdAt
                      ? new Date(row.createdAt).toLocaleDateString()
                      : "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleDeleteKey(row.key)}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {(hasMore || page > 1) && (
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-750 flex justify-between">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Page {page}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={!hasMore}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
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
