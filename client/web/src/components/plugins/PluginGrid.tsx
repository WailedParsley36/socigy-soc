// components/plugins/PluginGrid.tsx
import { useState, useEffect } from "react";
import PluginCard from "./PluginCard";
import PluginFilters from "./PluginFilters";
import {
  PluginRecommendation,
  PluginRecommendationRequest,
} from "@/lib/api/PluginAPI";

interface PluginGridProps {
  fetchFunction: (options: PluginRecommendationRequest) => Promise<any>;
  initialLimit?: number;
}

export default function PluginGrid({
  fetchFunction,
  initialLimit = 20,
}: PluginGridProps) {
  const [plugins, setPlugins] = useState<PluginRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [filters, setFilters] = useState<Partial<PluginRecommendationRequest>>(
    {}
  );
  const limit = initialLimit;

  const loadPlugins = async (reset = false) => {
    if (reset) {
      setOffset(0);
      setPlugins([]);
    }

    setLoading(true);
    try {
      const newOffset = reset ? 0 : offset;
      const response = await fetchFunction({
        limit,
        offset: newOffset,
        ...filters,
      });

      if (response.result) {
        if (reset) {
          setPlugins(response.result);
        } else {
          setPlugins((prev) => [...prev, ...response.result]);
        }

        // If we got fewer results than requested, we've reached the end
        setHasMore(response.result.length === limit);
        setOffset(newOffset + response.result.length);
      }
    } catch (error) {
      console.error("Failed to load plugins:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlugins(true);
  }, [fetchFunction, filters]);

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  return (
    <div>
      <PluginFilters onFilterChange={handleFilterChange} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {plugins.map((plugin) => (
          <PluginCard key={plugin.plugin_id.toString()} plugin={plugin} />
        ))}

        {loading && (
          <>
            {[...Array(4)].map((_, i) => (
              <div
                key={`skeleton-${i}`}
                className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
              ></div>
            ))}
          </>
        )}
      </div>

      {plugins.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            No plugins found
          </p>
          <p className="text-gray-400 dark:text-gray-500 mt-2">
            Try adjusting your filters or search terms
          </p>
        </div>
      )}

      {hasMore && plugins.length > 0 && (
        <div className="mt-10 text-center">
          <button
            onClick={() => loadPlugins(false)}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
}
