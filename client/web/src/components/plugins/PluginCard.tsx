"use client";

import Link from "next/link";
import PluginInstallButton from "./PluginInstallButton";
import { useState } from "react";
import { PluginRecommendation, VerificationStatus } from "@/lib/api/PluginAPI";
import { PluginStore } from "@/stores/PluginStorev2";

interface PluginCardProps {
  plugin: PluginRecommendation;
  pluginStore: PluginStore;
}

export default function PluginCard({ plugin, pluginStore }: PluginCardProps) {
  const [isInstalled, setIsInstalled] = useState(
    pluginStore.isInstalled(plugin.plugin_id)
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 h-full flex flex-col">
      <Link href={`/plugins/${plugin.plugin_id}`} className="block">
        <div className="h-40 bg-gray-100 dark:bg-gray-700 relative">
          {plugin.iconUrl ? (
            <img
              src={plugin.iconUrl}
              alt={plugin.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16"
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

          {plugin.verificationStatus === VerificationStatus.Verified && (
            <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
              Verified
            </div>
          )}
        </div>
      </Link>

      <div className="p-4 flex-grow">
        <Link href={`/plugins/${plugin.plugin_id}`} className="block">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            {plugin.title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-3">
            {plugin.description || "No description available"}
          </p>

          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center mr-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
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
              {plugin.avgRating.toFixed(1)}
            </div>
            <div className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
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
              {plugin.installationCount}
            </div>
          </div>
        </Link>
      </div>

      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-100 dark:border-gray-600">
        <div className="flex justify-between items-center">
          {isInstalled ? (
            <span className="text-sm font-medium text-green-600 dark:text-green-400 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
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
            </span>
          ) : (
            <PluginInstallButton
              plugin={plugin}
              size="sm"
              onSuccess={() => setIsInstalled(true)}
            />
          )}
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {new Date(plugin.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
}
