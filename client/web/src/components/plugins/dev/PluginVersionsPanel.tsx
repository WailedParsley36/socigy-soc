import { useState, useEffect } from "react";
import CreateVersionModal from "./modals/CreateVersionModal";
import EditVersionModal from "./modals/EditVersionModal";
import { useToast } from "@/contexts/ToastContext";
import { PluginVersion, PluginAPI, PublishStatus } from "@/lib/api/PluginAPI";
import { Guid } from "@/lib/structures/Guid";

interface PluginVersionsPanelProps {
  pluginId: Guid;
}

export default function PluginVersionsPanel({
  pluginId,
}: PluginVersionsPanelProps) {
  const [versions, setVersions] = useState<PluginVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedVersion, setExpandedVersion] = useState<Guid | null>(null);
  const [publishingVersion, setPublishingVersion] = useState<Guid | null>(null);
  const [removingVersion, setRemovingVersion] = useState<Guid | null>(null);
  // New state for editing
  const [editingVersion, setEditingVersion] = useState<PluginVersion | null>(
    null
  );
  const { showToast } = useToast();

  useEffect(() => {
    loadVersions();
  }, [pluginId]);

  const loadVersions = async () => {
    setLoading(true);
    try {
      const response = await PluginAPI.getPluginVersions(pluginId);
      if (response.result) {
        setVersions(response.result);
        // Auto-expand the latest version if none is expanded
        if (!expandedVersion && response.result.length > 0) {
          setExpandedVersion(response.result[0].version_id);
        }
      }
    } catch (error) {
      console.error("Failed to load plugin versions:", error);
      showToast({
        title: "Error",
        description: "Failed to load plugin versions",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSuccess = (version: PluginVersion) => {
    showToast({
      title: "Success",
      description: "Version created successfully",
      type: "success",
    });
    setShowCreateModal(false);
    setVersions((prev) => [version, ...prev]);
    setExpandedVersion(version.version_id);
  };

  // New function to handle edit success
  const handleEditSuccess = (updatedVersion: PluginVersion) => {
    showToast({
      title: "Success",
      description: "Version updated successfully",
      type: "success",
    });
    setEditingVersion(null);
    setVersions((prev) =>
      prev.map((v) =>
        v.version_id === updatedVersion.version_id ? updatedVersion : v
      )
    );
  };

  const handlePublishVersion = async (versionId: Guid) => {
    if (
      !confirm(
        "Are you sure you want to publish this version? This will make it available to users."
      )
    ) {
      return;
    }

    setPublishingVersion(versionId);
    try {
      await PluginAPI.publishPluginVersion(pluginId, versionId);
      showToast({
        title: "Success",
        description: "Version published successfully",
        type: "success",
      });
      loadVersions();
    } catch (error) {
      console.error("Failed to publish version:", error);
      showToast({
        title: "Error",
        description: "Failed to publish version",
        type: "error",
      });
    } finally {
      setPublishingVersion(null);
    }
  };

  const handleRemoveVersion = async (versionId: Guid) => {
    if (
      !confirm(
        "Are you sure you want to remove this version? This action cannot be undone."
      )
    ) {
      return;
    }

    setRemovingVersion(versionId);
    try {
      await PluginAPI.removePluginVersion(pluginId, versionId);
      showToast({
        title: "Success",
        description: "Version removed successfully",
        type: "success",
      });
      setVersions((prev) => prev.filter((v) => v.version_id !== versionId));
      if (expandedVersion === versionId) {
        setExpandedVersion(null);
      }
    } catch (error) {
      console.error("Failed to remove version:", error);
      showToast({
        title: "Error",
        description: "Failed to remove version",
        type: "error",
      });
    } finally {
      setRemovingVersion(null);
    }
  };

  // New function to handle edit button click
  const handleEditVersion = (version: PluginVersion) => {
    setEditingVersion(version);
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="flex justify-between items-center mb-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/6"></div>
        </div>
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="mb-4 border border-gray-200 dark:border-gray-700 rounded-lg"
          >
            <div className="p-4">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Plugin Versions
        </h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Create New Version
        </button>
      </div>

      {versions.length === 0 ? (
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Versions Yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            You haven't created any versions for this plugin yet. Click the
            "Create New Version" button to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {versions.map((version) => (
            <div
              key={version.version_id.toString()}
              className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
            >
              <div
                className="p-4 bg-white dark:bg-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 flex justify-between items-center"
                onClick={() =>
                  setExpandedVersion(
                    expandedVersion === version.version_id
                      ? null
                      : version.version_id
                  )
                }
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Version {version.versionString}
                    </h3>
                    {version.isActive && !version.isBeta && (
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        Active
                      </span>
                    )}
                    {version.isBeta && (
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                        Beta
                      </span>
                    )}
                    {version.publishStatus === PublishStatus.Published && (
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        Published
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Created on{" "}
                    {new Date(version.createdAt).toLocaleDateString()}
                    {version.updatedAt &&
                      version.updatedAt !== version.createdAt && (
                        <>
                          {" "}
                          · Updated on{" "}
                          {new Date(version.updatedAt).toLocaleDateString()}
                        </>
                      )}
                  </p>
                </div>
                <div className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-5 w-5 text-gray-400 transition-transform ${
                      expandedVersion === version.version_id
                        ? "transform rotate-180"
                        : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>

              {expandedVersion === version.version_id && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Version Details
                      </h4>
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">
                              Version String
                            </span>
                            <span className="text-gray-900 dark:text-white font-medium">
                              {version.versionString}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">
                              System API Version
                            </span>
                            <span className="text-gray-900 dark:text-white font-medium">
                              {version.systemApiVersion}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">
                              Language
                            </span>
                            <span className="text-gray-900 dark:text-white font-medium">
                              {version.language}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">
                              Status
                            </span>
                            <span className="text-gray-900 dark:text-white font-medium">
                              {version.publishStatus === PublishStatus.Published
                                ? "Published"
                                : version.publishStatus ===
                                  PublishStatus.Reviewing
                                ? "Under Review"
                                : version.publishStatus ===
                                  PublishStatus.Preparing
                                ? "Draft"
                                : "Taken Down"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">
                              Active
                            </span>
                            <span className="text-gray-900 dark:text-white font-medium">
                              {version.isActive ? "Yes" : "No"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">
                              Beta
                            </span>
                            <span className="text-gray-900 dark:text-white font-medium">
                              {version.isBeta ? "Yes" : "No"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {version.releaseNotes && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Release Notes
                          </h4>
                          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                              {version.releaseNotes}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Configuration
                      </h4>
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 h-64 overflow-auto">
                        {version.config ? (
                          <pre className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                            {JSON.stringify(version.parsedConfig, null, 2)}
                          </pre>
                        ) : (
                          <p className="text-gray-500 dark:text-gray-400 text-center mt-4">
                            No configuration available
                          </p>
                        )}
                      </div>

                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Actions
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {/* New Edit button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditVersion(version);
                            }}
                            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                          >
                            Edit Version
                          </button>

                          {version.publishStatus !==
                            PublishStatus.Published && (
                            <button
                              onClick={() =>
                                handlePublishVersion(version.version_id)
                              }
                              disabled={
                                publishingVersion === version.version_id
                              }
                              className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {publishingVersion === version.version_id
                                ? "Publishing..."
                                : "Publish Version"}
                            </button>
                          )}

                          <button
                            onClick={() =>
                              handleRemoveVersion(version.version_id)
                            }
                            disabled={removingVersion === version.version_id}
                            className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {removingVersion === version.version_id
                              ? "Removing..."
                              : "Remove Version"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <CreateVersionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
        pluginId={pluginId}
      />

      {/* New Edit Version Modal */}
      {editingVersion && (
        <EditVersionModal
          isOpen={!!editingVersion}
          onClose={() => setEditingVersion(null)}
          onSuccess={handleEditSuccess}
          pluginId={pluginId}
          version={editingVersion}
        />
      )}
    </div>
  );
}
