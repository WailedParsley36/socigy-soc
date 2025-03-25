import { useToast } from "@/contexts/ToastContext";
import {
  LocalizationData,
  PluginAPI,
  EditLocalizationDataRequest,
} from "@/lib/api/PluginAPI";
import { Guid } from "@/lib/structures/Guid";
import { useState, useEffect } from "react";

interface PluginLocalizationsPanelProps {
  pluginId: Guid;
}

export default function PluginLocalizationsPanel({
  pluginId,
}: PluginLocalizationsPanelProps) {
  const [localizations, setLocalizations] = useState<LocalizationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocalizationIds, setSelectedLocalizationIds] = useState<
    Guid[]
  >([]);
  const [deleting, setDeleting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRegionCode, setNewRegionCode] = useState("");
  const [newLocalizedText, setNewLocalizedText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<Guid | null>(null);
  const [editText, setEditText] = useState("");
  const { showToast } = useToast();

  useEffect(() => {
    loadLocalizations();
  }, [pluginId]);

  const loadLocalizations = async () => {
    setLoading(true);
    try {
      const response = await PluginAPI.getPluginLocalizations(pluginId);
      if (response.result) {
        setLocalizations(response.result);
      }
    } catch (error) {
      console.error("Failed to load localizations:", error);
      showToast({
        title: "Error",
        description: "Failed to load localizations",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddLocalization = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newRegionCode.trim()) {
      showToast({
        title: "Validation Error",
        description: "Region code is required",
        type: "error",
      });
      return;
    }

    if (!newLocalizedText.trim()) {
      showToast({
        title: "Validation Error",
        description: "Localized text is required",
        type: "error",
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await PluginAPI.addPluginLocalization(
        pluginId,
        newRegionCode,
        newLocalizedText
      );

      if (response.error) {
        throw new Error(response.error.message || "Failed to add localization");
      }

      if (response.result) {
        showToast({
          title: "Success",
          description: "Localization added successfully",
          type: "success",
        });
        setLocalizations((prev) => [...prev, response.result!]);
        setNewRegionCode("");
        setNewLocalizedText("");
        setShowAddForm(false);
      }
    } catch (error) {
      console.error("Failed to add localization:", error);
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

  const handleEditLocalization = async (id: Guid) => {
    if (!editText.trim()) {
      showToast({
        title: "Validation Error",
        description: "Localized text is required",
        type: "error",
      });
      return;
    }

    try {
      const data: EditLocalizationDataRequest = {
        content: editText,
      };

      const response = await PluginAPI.editPluginLocalization(
        pluginId,
        id,
        data
      );

      if (response.error) {
        throw new Error(
          response.error.message || "Failed to update localization"
        );
      }

      if (response.result) {
        showToast({
          title: "Success",
          description: "Localization updated successfully",
          type: "success",
        });
        setLocalizations((prev) =>
          prev.map((loc) => (loc.localization_id === id ? response.result! : loc))
        );
        setEditingId(null);
        setEditText("");
      }
    } catch (error) {
      console.error("Failed to update localization:", error);
      showToast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
        type: "error",
      });
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedLocalizationIds.length === 0) {
      showToast({
        title: "Validation Error",
        description: "Please select localizations to delete",
        type: "error",
      });
      return;
    }

    if (
      !confirm(
        `Are you sure you want to delete ${selectedLocalizationIds.length} selected localizations? This action cannot be undone.`
      )
    ) {
      return;
    }

    setDeleting(true);
    try {
      await PluginAPI.removePluginLocalizations(
        pluginId,
        selectedLocalizationIds
      );

      showToast({
        title: "Success",
        description: `${selectedLocalizationIds.length} localizations deleted successfully`,
        type: "success",
      });
      setLocalizations((prev) =>
        prev.filter((loc) => !selectedLocalizationIds.includes(loc.localization_id))
      );
      setSelectedLocalizationIds([]);
    } catch (error) {
      console.error("Failed to delete localizations:", error);
      showToast({
        title: "Error",
        description: "Failed to delete localizations",
        type: "error",
      });
    } finally {
      setDeleting(false);
    }
  };

  const toggleLocalizationSelection = (id: Guid) => {
    setSelectedLocalizationIds((prev) =>
      prev.includes(id) ? prev.filter((locId) => locId !== id) : [...prev, id]
    );
  };

  const isLocalizationSelected = (id: Guid) => {
    return selectedLocalizationIds.includes(id);
  };

  const startEditing = (localization: LocalizationData) => {
    setEditingId(localization.localization_id);
    setEditText(localization.localizedText);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Plugin Localizations
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Add Localization
          </button>
          <button
            onClick={handleDeleteSelected}
            disabled={deleting || selectedLocalizationIds.length === 0}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deleting ? "Deleting..." : "Delete Selected"}
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Add New Localization
          </h3>
          <form onSubmit={handleAddLocalization} className="space-y-4">
            <div>
              <label
                htmlFor="regionCode"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Region Code *
              </label>
              <input
                type="text"
                id="regionCode"
                value={newRegionCode}
                onChange={(e) => setNewRegionCode(e.target.value)}
                placeholder="e.g., en-US, fr-FR, es-ES"
                className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                required
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Use ISO language codes (e.g., en-US for English, fr-FR for
                French)
              </p>
            </div>

            <div>
              <label
                htmlFor="localizedText"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Localized Text *
              </label>
              <textarea
                id="localizedText"
                value={newLocalizedText}
                onChange={(e) => setNewLocalizedText(e.target.value)}
                rows={5}
                className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Adding..." : "Add Localization"}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-20 bg-gray-200 dark:bg-gray-700 rounded"
            ></div>
          ))}
        </div>
      ) : localizations.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm text-center">
          <p className="text-gray-500 dark:text-gray-400">
            No localizations found. Add your first localization to make your
            plugin available in multiple languages.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-750">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  <input
                    type="checkbox"
                    checked={
                      selectedLocalizationIds.length === localizations.length &&
                      localizations.length > 0
                    }
                    onChange={() => {
                      if (
                        selectedLocalizationIds.length === localizations.length
                      ) {
                        setSelectedLocalizationIds([]);
                      } else {
                        setSelectedLocalizationIds(
                          localizations.map((loc) => loc.localization_id)
                        );
                      }
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Region Code
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Localized Text
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Created At
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {localizations.map((localization) => (
                <tr key={localization.localization_id.toString()}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={isLocalizationSelected(localization.localization_id)}
                      onChange={() =>
                        toggleLocalizationSelection(localization.localization_id)
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {localization.regionCode}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                    {editingId === localization.localization_id ? (
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        rows={3}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    ) : (
                      <div className="max-h-24 overflow-y-auto">
                        {localization.localizedText}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(localization.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {editingId === localization.localization_id ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={() =>
                            handleEditLocalization(localization.localization_id)
                          }
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEditing(localization)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
