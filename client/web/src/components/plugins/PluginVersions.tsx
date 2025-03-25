import { useState, useEffect } from "react";
import { PluginAPI, PluginVersion } from "@/lib/api/PluginAPI";
import { Guid } from "@/lib/structures/Guid";

interface PluginVersionsProps {
  pluginId: Guid;
}

export default function PluginVersions({ pluginId }: PluginVersionsProps) {
  const [versions, setVersions] = useState<PluginVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedVersion, setExpandedVersion] = useState<Guid | null>(null);

  useEffect(() => {
    const loadVersions = async () => {
      try {
        const response = await PluginAPI.getPluginVersions(pluginId);
        if (response.result) {
          setVersions(response.result);
          // Auto-expand the latest version
          if (response.result.length > 0) {
            setExpandedVersion(response.result[0].version_id);
          }
        }
      } catch (error) {
        console.error("Failed to load plugin versions:", error);
      } finally {
        setLoading(false);
      }
    };

    loadVersions();
  }, [pluginId]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm animate-pulse">
        <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-16 bg-gray-200 dark:bg-gray-700 rounded"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Version History
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          No versions available
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        Version History
      </h2>

      <div className="space-y-4">
        {versions.map((version) => (
          <div
            key={version.version_id.toString()}
            className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
          >
            <div
              className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750"
              onClick={() =>
                setExpandedVersion(
                  expandedVersion === version.version_id
                    ? null
                    : version.version_id
                )
              }
            >
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">
                  Version {version.versionString}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Released on {new Date(version.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div className="flex items-center">
                {version.isActive && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs rounded-full mr-3">
                    Active
                  </span>
                )}
                {version.isBeta && (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 text-xs rounded-full mr-3">
                    Beta
                  </span>
                )}
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
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    Release Notes
                  </h4>
                  <p className="text-gray-700 dark:text-gray-300">
                    {version.releaseNotes || "No release notes available"}
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    Technical Details
                  </h4>
                  <div className="space-y-1 text-sm">
                    <p className="text-gray-700 dark:text-gray-300">
                      <span className="font-medium">System API Version:</span>{" "}
                      {version.systemApiVersion}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Language:</span>{" "}
                      {version.language}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Verification Status:</span>{" "}
                      {version.verificationStatus === 0
                        ? "Unverified"
                        : version.verificationStatus === 1
                        ? "Pending"
                        : version.verificationStatus === 2
                        ? "Verified"
                        : "Malicious"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
