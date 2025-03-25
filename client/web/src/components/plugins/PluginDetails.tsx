import { useState, useEffect } from "react";
import { PluginAPI, PluginRecommendation } from "@/lib/api/PluginAPI";
import { Guid } from "@/lib/structures/Guid";
import Image from "next/image";

interface PluginDetailsProps {
  pluginId: Guid;
}

export default function PluginDetails({ pluginId }: PluginDetailsProps) {
  const [plugin, setPlugin] = useState<PluginRecommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [pluginVersion, setPluginVersion] = useState<string>();

  useEffect(() => {
    const loadPlugin = async () => {
      try {
        const response = await PluginAPI.getPluginDetails(pluginId);
        if (response.result) {
          setPlugin(response.result);
        }

        setPluginVersion(
          (await PluginAPI.getPluginVersions(pluginId)).result?.[0]
            .versionString ?? "X.X.X"
        );
      } catch (error) {
        console.error("Failed to load plugin details:", error);
      } finally {
        setLoading(false);
      }
    };

    loadPlugin();
  }, [pluginId]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm animate-pulse">
        <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
        </div>
      </div>
    );
  }

  if (!plugin) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <p className="text-red-500 dark:text-red-400">
          Failed to load plugin details
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm mb-8">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        About This Plugin
      </h2>

      <div className="prose dark:prose-invert max-w-none">
        <p className="text-gray-700 dark:text-gray-300">
          {plugin.description || "No description available"}
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Details
          </h3>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Version</span>
              <span className="text-gray-900 dark:text-white font-medium">
                {pluginVersion ?? "X.X.X"}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Released</span>
              <span className="text-gray-900 dark:text-white font-medium">
                {new Date(plugin.createdAt).toLocaleDateString()}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Price</span>
              <span className="text-gray-900 dark:text-white font-medium">
                {plugin.paymentType === 0
                  ? "Free"
                  : `$${plugin.price?.toFixed(2)}`}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                Platforms
              </span>
              <span className="text-gray-900 dark:text-white font-medium">
                {plugin.platforms === 7
                  ? "All Platforms"
                  : [
                      plugin.platforms & 1 ? "Web" : "",
                      plugin.platforms & 2 ? "Mobile" : "",
                      plugin.platforms & 4 ? "Desktop" : "",
                    ]
                      .filter(Boolean)
                      .join(", ")}
              </span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Developer
          </h3>

          <div className="flex items-center">
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mr-4 flex items-center justify-center">
              {plugin.developerIconUrl ? (
                <Image
                  src={plugin.developerIconUrl}
                  alt={plugin.developerUsername || "Profile"}
                  width={32}
                  height={32}
                  className="h-full w-full object-cover"
                  unoptimized={true}
                />
              ) : (
                <span className="text-blue-600 font-medium text-lg">
                  {plugin.developerUsername?.charAt(0) || "U"}
                </span>
              )}
            </div>

            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {plugin.developerUsername} #{plugin.developerTag}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {plugin.developerEmail}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <button className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline">
              View all plugins by this developer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
