// components/plugins/VersionSelector.tsx
import { useState, useEffect } from "react";
import { Guid } from "@/lib/structures/Guid";
import {
  PluginAPI,
  PluginVersion,
  VerificationStatus,
} from "@/lib/api/PluginAPI";

interface VersionSelectorProps {
  pluginId: Guid;
  onVersionSelect: (versionId: Guid) => void;
  initialVersionId?: Guid;
}

export default function VersionSelector({
  pluginId,
  onVersionSelect,
  initialVersionId,
}: VersionSelectorProps) {
  const [versions, setVersions] = useState<PluginVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersionId, setSelectedVersionId] = useState<Guid | undefined>(
    initialVersionId
  );
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const loadVersions = async () => {
      setLoading(true);
      try {
        const response = await PluginAPI.getPluginVersions(pluginId);
        if (response.error) throw new Error("Failed");

        const data = response.result!;
        setVersions(data);
        if (!initialVersionId) {
          const latestStable = data.find(
            (v: PluginVersion) => v.isActive && !v.isBeta
          );
          if (latestStable) {
            setSelectedVersionId(latestStable.version_id);
            onVersionSelect(latestStable.version_id);
          } else if (data.length > 0) {
            setSelectedVersionId(data[0].version_id);
            onVersionSelect(data[0].version_id);
          }
        }
      } catch (error) {
        console.error("Failed to load plugin versions:", error);
      } finally {
        setLoading(false);
      }
    };

    loadVersions();
  }, [pluginId, initialVersionId, onVersionSelect]);

  const handleVersionSelect = (versionId: Guid) => {
    setSelectedVersionId(versionId);
    onVersionSelect(versionId);
    setIsOpen(false);
  };

  const selectedVersion = versions.find(
    (v: PluginVersion) => v.version_id === selectedVersionId
  );

  return (
    <div className="relative">
      <div className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
        Select Version
      </div>

      <button
        type="button"
        className="relative w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        onClick={() => setIsOpen(!isOpen)}
      >
        {loading ? (
          <div className="flex items-center">
            <svg
              className="animate-spin h-4 w-4 mr-2 text-gray-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span>Loading versions...</span>
          </div>
        ) : selectedVersion ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="block truncate mr-2 text-gray-600">
                v{selectedVersion.versionString}
              </span>
              {selectedVersion.isActive && !selectedVersion.isBeta && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  Stable
                </span>
              )}
              {selectedVersion.isBeta && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                  Beta
                </span>
              )}
              {selectedVersion.verificationStatus ===
                VerificationStatus.Verified && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  Verified
                </span>
              )}
            </div>
            <span className="text-gray-500 text-sm">
              {new Date(
                selectedVersion.createdAt || Date.now()
              ).toLocaleDateString()}
            </span>
          </div>
        ) : (
          <span className="block truncate text-gray-500">
            No versions available
          </span>
        )}

        <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <svg
            className="h-5 w-5 text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
          {versions.length === 0 ? (
            <div className="text-center py-2 px-4 text-gray-500">
              No versions available
            </div>
          ) : (
            versions.map((version) => (
              <button
                key={version.version_id.toString()}
                type="button"
                className={`w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  selectedVersionId === version.version_id
                    ? "bg-gray-100 dark:bg-gray-700"
                    : ""
                }`}
                onClick={() => handleVersionSelect(version.version_id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="block truncate mr-2 text-gray-600">
                      v{version.versionString}
                    </span>
                    {version.isActive && !version.isBeta && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        Stable
                      </span>
                    )}
                    {version.isBeta && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                        Beta
                      </span>
                    )}
                    {version.verificationStatus ===
                      VerificationStatus.Verified && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        Verified
                      </span>
                    )}
                  </div>
                  <span className="text-gray-500 text-sm">
                    {new Date(
                      version.createdAt || Date.now()
                    ).toLocaleDateString()}
                  </span>
                </div>

                {version.releaseNotes && (
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                    {version.releaseNotes}
                  </p>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
