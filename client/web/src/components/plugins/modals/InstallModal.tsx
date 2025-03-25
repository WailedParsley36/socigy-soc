// components/plugins/InstallModal.tsx
import { useState } from "react";
import { useToast } from "@/contexts/ToastContext";
import { PluginRecommendation, PaymentType } from "@/lib/api/PluginAPI";
import {
  InstallPluginRequest,
  PluginInstallationAPI,
} from "@/lib/api/PluginInstallationHelper";
import { Guid } from "@/lib/structures/Guid";
import VersionSelector from "../VersionSelector";
import { usePluginStore } from "@/stores/PluginStorev2";

interface InstallModalProps {
  plugin: PluginRecommendation;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (installationId: Guid) => void;
}

export default function InstallModal({
  plugin,
  isOpen,
  onClose,
  onSuccess,
}: InstallModalProps) {
  const [selectedVersionId, setSelectedVersionId] = useState<
    Guid | undefined
  >();
  const [installing, setInstalling] = useState(false);
  const { showToast } = useToast();
  const pluginStore = usePluginStore();

  if (!isOpen) return null;

  const handleVersionSelect = (versionId: Guid) => {
    setSelectedVersionId(versionId);
  };

  const handleInstall = async () => {
    if (!selectedVersionId) {
      showToast({
        title: "Version Required",
        description: "Please select a version to install",
        type: "warning",
      });
      return;
    }

    setInstalling(true);

    try {
      if (plugin.paymentType !== PaymentType.Free) {
        showToast({
          title: "Payment Required",
          description: `This plugin costs $${plugin.price?.toFixed(
            2
          )}. Redirecting to payment...`,
          type: "info",
        });

        // TODO: Payments

        return;
      }

      // TODO: Optional: localizationId
      // TODO: Optional: deviceId
      const response = await pluginStore.installPlugin(
        plugin.plugin_id,
        selectedVersionId as Guid
      );

      showToast({
        title: "Installation Successful",
        description: `${plugin.title} has been installed successfully.`,
        type: "success",
      });

      onSuccess(response.installation_id);
      onClose();
    } catch (error) {
      console.error("Installation failed:", error);
      showToast({
        title: "Installation Failed",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
        type: "error",
      });
    } finally {
      setInstalling(false);
    }
  };

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
          <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3
                  className="text-lg leading-6 font-medium text-gray-900 dark:text-white"
                  id="modal-title"
                >
                  Install {plugin.title}
                </h3>

                <div className="mt-4">
                  {plugin.iconUrl && (
                    <div className="flex items-center mb-4">
                      <img
                        src={plugin.iconUrl}
                        alt={plugin.title}
                        className="w-12 h-12 rounded-md mr-4"
                      />
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {plugin.title}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {plugin.paymentType === PaymentType.Free
                            ? "Free"
                            : `$${plugin.price?.toFixed(2)}`}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="mb-4">
                    <VersionSelector
                      pluginId={plugin.plugin_id}
                      onVersionSelect={handleVersionSelect}
                    />
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md mb-4">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Plugin Details
                    </h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li>
                        <span className="font-medium">Developer:</span>{" "}
                        {plugin.developerUsername || "Unknown"}{" "}
                      </li>
                      <li>
                        <span className="font-medium">Platforms:</span>{" "}
                        {plugin.platforms === 7
                          ? "All Platforms"
                          : [
                              plugin.platforms & 1 ? "Web" : "",
                              plugin.platforms & 2 ? "Mobile" : "",
                              plugin.platforms & 4 ? "Desktop" : "",
                            ]
                              .filter(Boolean)
                              .join(", ")}
                      </li>
                      <li>
                        <span className="font-medium">Rating:</span>{" "}
                        {plugin.avgRating.toFixed(1)} ({plugin.reviewCount}{" "}
                        reviews)
                      </li>
                      <li>
                        <span className="font-medium">Installations:</span>{" "}
                        {plugin.installationCount}
                      </li>
                    </ul>
                  </div>

                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    <p>
                      By installing this plugin, you agree to the plugin's terms
                      of service and privacy policy.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm ${
                plugin.paymentType === PaymentType.Free
                  ? "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
                  : "bg-green-600 hover:bg-green-700 focus:ring-green-500"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              onClick={handleInstall}
              disabled={installing || !selectedVersionId}
            >
              {installing ? (
                <div className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                  Installing...
                </div>
              ) : plugin.paymentType === PaymentType.Free ? (
                "Install"
              ) : (
                `Buy $${plugin.price?.toFixed(2)}`
              )}
            </button>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onClose}
              disabled={installing}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
