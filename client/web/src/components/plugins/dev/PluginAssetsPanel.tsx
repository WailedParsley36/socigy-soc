import { useToast } from "@/contexts/ToastContext";
import { PluginAsset, PluginAPI } from "@/lib/api/PluginAPI";
import { Guid } from "@/lib/structures/Guid";
import { useState, useEffect } from "react";

interface PluginAssetsPanelProps {
  pluginId: Guid;
}

export default function PluginAssetsPanel({
  pluginId,
}: PluginAssetsPanelProps) {
  const [assets, setAssets] = useState<PluginAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssets, setSelectedAssets] = useState<Guid[]>([]);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [assetKeys, setAssetKeys] = useState<string[]>([]);
  const { showToast } = useToast();

  useEffect(() => {
    loadAssets();
  }, [pluginId]);

  const loadAssets = async () => {
    setLoading(true);
    try {
      const response = await PluginAPI.getPluginAssets(pluginId);
      if (response.result) {
        setAssets(response.result);
      }
    } catch (error) {
      console.error("Failed to load plugin assets:", error);
      showToast({
        title: "Error",
        description: "Failed to load plugin assets",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileArray = Array.from(e.target.files);
      setFiles(fileArray);

      // Generate default keys based on filenames
      const keys = fileArray.map((file) =>
        file.name
          .replace(/\.[^/.]+$/, "")
          .toLowerCase()
          .replace(/\s+/g, "_")
      );
      setAssetKeys(keys);
    }
  };

  const handleKeyChange = (index: number, value: string) => {
    const newKeys = [...assetKeys];
    newKeys[index] = value;
    setAssetKeys(newKeys);
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      showToast({
        title: "Validation Error",
        description: "Please select files to upload",
        type: "error",
      });
      return;
    }

    if (assetKeys.some((key) => !key.trim())) {
      showToast({
        title: "Validation Error",
        description: "All assets must have keys",
        type: "error",
      });
      return;
    }

    setUploading(true);
    try {
      const response = await PluginAPI.uploadPluginAssets(
        pluginId,
        files,
        assetKeys
      );

      if (response.error) {
        throw new Error(response.error.message || "Failed to upload assets");
      }

      if (response.result) {
        showToast({
          title: "Success",
          description: `${response.result.length} assets uploaded successfully`,
          type: "success",
        });
        setFiles([]);
        setAssetKeys([]);
        loadAssets();
      }
    } catch (error) {
      console.error("Failed to upload assets:", error);
      showToast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
        type: "error",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedAssets.length === 0) {
      showToast({
        title: "Validation Error",
        description: "Please select assets to delete",
        type: "error",
      });
      return;
    }

    if (
      !confirm(
        `Are you sure you want to delete ${selectedAssets.length} selected assets? This action cannot be undone.`
      )
    ) {
      return;
    }

    setDeleting(true);
    try {
      await PluginAPI.removePluginAssets(pluginId, selectedAssets);

      showToast({
        title: "Success",
        description: `${selectedAssets.length} assets deleted successfully`,
        type: "success",
      });
      setSelectedAssets([]);
      loadAssets();
    } catch (error) {
      console.error("Failed to delete assets:", error);
      showToast({
        title: "Error",
        description: "Failed to delete assets",
        type: "error",
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleSetAsStoreAsset = async (assetId: Guid) => {
    try {
      await PluginAPI.setPluginAssetAsStoreAsset(pluginId, assetId);

      showToast({
        title: "Success",
        description: "Asset set as store asset successfully",
        type: "success",
      });
      loadAssets();
    } catch (error) {
      console.error("Failed to set as store asset:", error);
      showToast({
        title: "Error",
        description: "Failed to set as store asset",
        type: "error",
      });
    }
  };

  const toggleAssetSelection = (assetId: Guid) => {
    setSelectedAssets((prev) =>
      prev.includes(assetId)
        ? prev.filter((id) => id !== assetId)
        : [...prev, assetId]
    );
  };

  const isAssetSelected = (assetId: Guid) => {
    return selectedAssets.includes(assetId);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Upload Assets</h2>
        <div className="space-y-4">
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((file, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={assetKeys[index]}
                    onChange={(e) => handleKeyChange(index, e.target.value)}
                    placeholder="Asset key"
                    className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md"
                  />
                  <span className="text-sm text-gray-500">{file.name}</span>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={handleUpload}
            disabled={uploading || files.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? "Uploading..." : "Upload Assets"}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Plugin Assets</h2>
          <button
            onClick={handleDeleteSelected}
            disabled={deleting || selectedAssets.length === 0}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deleting ? "Deleting..." : "Delete Selected"}
          </button>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-20 bg-gray-200 dark:bg-gray-700 rounded"
              ></div>
            ))}
          </div>
        ) : assets.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400">
            No assets found
          </p>
        ) : (
          <div className="space-y-4">
            {assets.map((asset) => (
              <div
                key={asset.asset_id.toString()}
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <input
                    type="checkbox"
                    checked={isAssetSelected(asset.asset_id)}
                    onChange={() => toggleAssetSelection(asset.asset_id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {asset.assetKey}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {asset.mediaType}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <a
                    href={asset.assetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    View
                  </a>
                  <button
                    onClick={() => handleSetAsStoreAsset(asset.asset_id)}
                    className="px-3 py-1 bg-green-100 dark:bg-green-700 text-green-700 dark:text-green-300 rounded-md hover:bg-green-200 dark:hover:bg-green-600"
                  >
                    Set as Store Asset
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
