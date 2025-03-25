"use client";

import { useState, useEffect } from "react";
import PluginCard from "./PluginCard";
import { PluginRecommendation } from "@/lib/api/PluginAPI";
import { useRouter } from "next/navigation";
import { usePluginStore } from "@/stores/PluginStorev2";

interface PluginSectionProps {
  title: string;
  description: string;
  fetchFunction: (options: any) => Promise<any>;
  href: string;
}

export default function PluginSection({
  title,
  description,
  fetchFunction,
  href,
}: PluginSectionProps) {
  const store = usePluginStore();
  const [plugins, setPlugins] = useState<PluginRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadPlugins = async () => {
      setLoading(true);
      try {
        const response = await fetchFunction({ limit: 8 });
        if (response.result) {
          setPlugins(response.result);
        }
      } catch (error) {
        console.error("Failed to load plugins:", error);
      } finally {
        setLoading(false);
      }
    };

    loadPlugins();
  }, [fetchFunction]);

  return (
    <section>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {title}
        </h2>
        <p className="text-gray-600 dark:text-gray-300">{description}</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
            ></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {plugins.map((plugin) => (
            <PluginCard
              key={plugin.plugin_id.toString()}
              plugin={plugin}
              pluginStore={store}
            />
          ))}
        </div>
      )}

      <div className="mt-6 text-center">
        <button
          onClick={() => router.push(`/plugins/category/${href}`)}
          className="cursor-pointer px-6 py-2 bg-transparent border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900 transition-colors"
        >
          View All {title}
        </button>
      </div>
    </section>
  );
}
