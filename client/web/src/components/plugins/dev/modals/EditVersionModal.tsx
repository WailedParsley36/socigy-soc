import { useState } from "react";
import {
  PluginAPI,
  PluginVersion,
  CreatePluginVersionRequest,
} from "@/lib/api/PluginAPI";
import { Guid } from "@/lib/structures/Guid";
import { useToast } from "@/contexts/ToastContext";

interface EditVersionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (version: PluginVersion) => void;
  pluginId: Guid;
  version: PluginVersion;
}

export default function EditVersionModal({
  isOpen,
  onClose,
  onSuccess,
  pluginId,
  version,
}: EditVersionModalProps) {
  const [releaseNotes, setReleaseNotes] = useState(version.releaseNotes || "");
  const [isActive, setIsActive] = useState(version.isActive);
  const [isBeta, setIsBeta] = useState(version.isBeta);
  const [configFile, setConfigFile] = useState<File | null>(null);
  const [moduleFile, setModuleFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setSubmitting(true);

    try {
      const versionData: Partial<CreatePluginVersionRequest> = {
        releaseNotes: releaseNotes || undefined,
        isActive,
        isBeta,
        config: configFile || undefined,
        module: moduleFile || undefined,
      };

      const response = await PluginAPI.editPluginVersion(
        pluginId,
        version.version_id,
        versionData
      );

      if (response.error) {
        throw new Error(response.error.message || "Failed to update version");
      }

      if (response.result) {
        onSuccess(response.result);
      }
    } catch (error) {
      console.error("Failed to update version:", error);
      showToast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfigFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setConfigFile(e.target.files[0]);
    }
  };

  const handleModuleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setModuleFile(e.target.files[0]);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          aria-hidden="true"
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                  <h3
                    className="text-lg leading-6 font-medium text-gray-900 dark:text-white"
                    id="modal-title"
                  >
                    Edit Version {version.versionString}
                  </h3>

                  <div className="mt-4 space-y-4">
                    <div>
                      <label
                        htmlFor="releaseNotes"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Release Notes
                      </label>
                      <textarea
                        id="releaseNotes"
                        value={releaseNotes}
                        onChange={(e) => setReleaseNotes(e.target.value)}
                        rows={4}
                        className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isActive"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="isActive"
                        className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                      >
                        Set as active version
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isBeta"
                        checked={isBeta}
                        onChange={(e) => setIsBeta(e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="isBeta"
                        className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                      >
                        Mark as beta version
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Configuration File
                      </label>
                      <div className="mt-1">
                        <input
                          type="file"
                          id="configFile"
                          accept=".json"
                          onChange={handleConfigFileChange}
                          className="hidden"
                        />
                        <label
                          htmlFor="configFile"
                          className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
                        >
                          {configFile
                            ? "Change Config File"
                            : "Upload New Config File"}
                        </label>
                        {configFile && (
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Selected: {configFile.name}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Only upload if you want to replace the existing config
                          file
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Module File
                      </label>
                      <div className="mt-1">
                        <input
                          type="file"
                          id="moduleFile"
                          accept=".wasm"
                          onChange={handleModuleFileChange}
                          className="hidden"
                        />
                        <label
                          htmlFor="moduleFile"
                          className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
                        >
                          {moduleFile
                            ? "Change Module File"
                            : "Upload New Module File"}
                        </label>
                        {moduleFile && (
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Selected: {moduleFile.name}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Only upload if you want to replace the existing
                          WebAssembly module
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
