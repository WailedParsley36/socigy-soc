// components/plugins/PluginFilters.tsx
import {
  PaymentType,
  PlatformType,
  VerificationStatus,
} from "@/lib/api/PluginAPI";
import { useState } from "react";

interface PluginFiltersProps {
  onFilterChange: (filters: any) => void;
}

export default function PluginFilters({ onFilterChange }: PluginFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState({
    platforms: PlatformType.All,
    paymentType: undefined,
    minVerificationStatuses: [VerificationStatus.Verified],
    sortBy: "installationCount",
    sortDirection: "desc",
  });

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="mb-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center text-gray-700 dark:text-gray-300 mb-2 hover:text-blue-600 dark:hover:text-blue-400"
      >
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
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
          />
        </svg>
        {isOpen ? "Hide Filters" : "Show Filters"}
      </button>

      {isOpen && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                Platform
              </h3>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="platform"
                    checked={filters.platforms === PlatformType.All}
                    onChange={() =>
                      handleFilterChange("platforms", PlatformType.All)
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">
                    All Platforms
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="platform"
                    checked={filters.platforms === PlatformType.Web}
                    onChange={() =>
                      handleFilterChange("platforms", PlatformType.Web)
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">
                    Web
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="platform"
                    checked={filters.platforms === PlatformType.Mobile}
                    onChange={() =>
                      handleFilterChange("platforms", PlatformType.Mobile)
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">
                    Mobile
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="platform"
                    checked={filters.platforms === PlatformType.Desktop}
                    onChange={() =>
                      handleFilterChange("platforms", PlatformType.Desktop)
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">
                    Desktop
                  </span>
                </label>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                Price
              </h3>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="price"
                    checked={filters.paymentType === undefined}
                    onChange={() =>
                      handleFilterChange("paymentType", undefined)
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">
                    All
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="price"
                    checked={filters.paymentType === PaymentType.Free}
                    onChange={() =>
                      handleFilterChange("paymentType", PaymentType.Free)
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">
                    Free
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="price"
                    checked={filters.paymentType === PaymentType.OneTime}
                    onChange={() =>
                      handleFilterChange("paymentType", PaymentType.OneTime)
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">
                    Paid
                  </span>
                </label>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                Sort By
              </h3>
              <select
                value={`${filters.sortBy}-${filters.sortDirection}`}
                onChange={(e) => {
                  const [sortBy, sortDirection] = e.target.value.split("-");
                  handleFilterChange("sortBy", sortBy);
                  handleFilterChange("sortDirection", sortDirection);
                }}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="installationCount-desc">Most Popular</option>
                <option value="createdAt-desc">Newest</option>
                <option value="averageRating-desc">Highest Rated</option>
                <option value="title-asc">Name (A-Z)</option>
                <option value="title-desc">Name (Z-A)</option>
              </select>

              <div className="mt-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.minVerificationStatuses.includes(
                      VerificationStatus.Verified
                    )}
                    onChange={(e) => {
                      const newStatuses = e.target.checked
                        ? [VerificationStatus.Verified]
                        : [];
                      handleFilterChange(
                        "minVerificationStatuses",
                        newStatuses
                      );
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">
                    Verified only
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={() => {
                setFilters({
                  platforms: PlatformType.All,
                  paymentType: undefined,
                  minVerificationStatuses: [VerificationStatus.Verified],
                  sortBy: "installationCount",
                  sortDirection: "desc",
                });
                onFilterChange({
                  platforms: PlatformType.All,
                  paymentType: undefined,
                  minVerificationStatuses: [VerificationStatus.Verified],
                  sortBy: "installationCount",
                  sortDirection: "desc",
                });
              }}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
