import { PluginAPI, PluginRecommendation } from "@/lib/api/PluginAPI";
import { Guid } from "@/lib/structures/Guid";
import { useState, useEffect } from "react";
import PluginInstallButton from "./PluginInstallButton";
import { PluginInstallationAPI } from "@/lib/api/PluginInstallationHelper";
import { usePluginStore } from "@/stores/PluginStorev2";

interface PluginHeaderProps {
  pluginId: Guid;
}

export default function PluginHeader({ pluginId }: PluginHeaderProps) {
  const [plugin, setPlugin] = useState<PluginRecommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installationId, setInstallationId] = useState<string>();
  const pluginStore = usePluginStore();

  useEffect(() => {
    const loadPlugin = async () => {
      try {
        const response = await PluginAPI.getPluginDetails(pluginId);
        if (response.result) {
          setPlugin(response.result);
        }
      } catch (error) {
        console.error("Failed to load plugin details:", error);
      } finally {
        setLoading(false);
      }
    };

    const checkInstallationStatus = async () => {
      try {
        const installations = await PluginInstallationAPI.getInstallations();
        if (installations.result) {
          const installed = installations.result.find(
            (installation) =>
              installation.pluginId.toString() === pluginId.toString()
          );
          if (installed) {
            setInstallationId(installed.installation_id);
            setIsInstalled(true);
          }
        }
      } catch (error) {
        console.error("Failed to check installation status:", error);
      }
    };

    checkInstallationStatus();
    loadPlugin();
  }, [pluginId]);

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white animate-pulse">
        <div className="container mx-auto px-4 py-12">
          <div className="h-8 w-64 bg-white bg-opacity-20 rounded mb-4"></div>
          <div className="h-4 w-96 bg-white bg-opacity-20 rounded"></div>
        </div>
      </div>
    );
  }

  if (!plugin) {
    return (
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold mb-4">Plugin Not Found</h1>
          <p className="text-xl opacity-90">
            The requested plugin could not be loaded
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="w-24 h-24 bg-white rounded-lg overflow-hidden shadow-lg">
            {plugin.iconUrl ? (
              <img
                src={plugin.iconUrl}
                alt={plugin.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
                  />
                </svg>
              </div>
            )}
          </div>

          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              {plugin.title}
            </h1>
            <p className="text-lg opacity-90 mb-4">
              {plugin.description || "No description available"}
            </p>

            <div className="flex flex-wrap gap-4">
              <div className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                  />
                </svg>
                {plugin.avgRating.toFixed(1)} ({plugin.reviewCount} reviews)
              </div>

              <div className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                {plugin.installationCount} installations
              </div>

              <div className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                {new Date(plugin.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>

          <div className="mt-6 md:mt-0 flex flex-col gap-3">
            <div className="mt-6 md:mt-0 flex flex-col gap-3">
              {isInstalled ? (
                <>
                  <div className="px-6 py-3 bg-gray-100 text-green-600 rounded-lg font-medium flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Installed
                  </div>
                  <button
                    onClick={async () => {
                      setIsInstalled(false);
                      setInstallationId(undefined);
                      await pluginStore.uninstallPlugin(
                        installationId! as Guid
                      );
                    }}
                    className={`px-4 py-2 font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors bg-red-600 hover:bg-red-700 text-white`}
                  >
                    Uninstall
                  </button>
                </>
              ) : (
                <PluginInstallButton
                  plugin={plugin}
                  size="lg"
                  onSuccess={(id) => {
                    setIsInstalled(true);
                    setInstallationId(id);
                  }}
                />
              )}

              <button className="px-6 py-2 border border-white text-white rounded-lg font-medium hover:bg-white hover:bg-opacity-10 transition-colors">
                Report Issue
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
