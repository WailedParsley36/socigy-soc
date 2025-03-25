import { PluginAPI, PublishStatus } from "@/lib/api/PluginAPI";
import { Plugin } from "@/lib/api/PluginInstallationHelper";
import { useState, useEffect } from "react";

export default function VersionManager({ plugin }: { plugin: Plugin }) {
  const [versions, setVersions] = useState([]);
  const [newVersion, setNewVersion] = useState({
    versionString: "",
    systemApiVersion: "",
    releaseNotes: "",
    isActive: false,
    isBeta: false,
  });

  useEffect(() => {
    loadVersions();
  }, [plugin]);

  async function loadVersions() {
    const response = await PluginAPI.getPluginVersions(plugin.id);
    if (response.result) {
      setVersions(response.result);
    }
  }

  async function handleCreateVersion() {
    const response = await PluginAPI.createPluginVersion(plugin.id, newVersion);
    if (response.result) {
      loadVersions();
      setNewVersion({
        versionString: "",
        systemApiVersion: "",
        releaseNotes: "",
        isActive: false,
        isBeta: false,
      });
    }
  }

  async function handlePublishVersion(versionId) {
    await PluginAPI.publishPluginVersion(plugin.id, versionId);
    loadVersions();
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Version Manager</h2>

      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">Create New Version</h3>
        <input
          type="text"
          placeholder="Version String"
          value={newVersion.versionString}
          onChange={(e) =>
            setNewVersion({ ...newVersion, versionString: e.target.value })
          }
          className="mb-2 p-2 border rounded"
        />
        {/* Add other input fields for newVersion */}
        <button
          onClick={handleCreateVersion}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Create Version
        </button>
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-2">Existing Versions</h3>
        {versions.map((version) => (
          <div key={version.version_id} className="mb-4 p-4 border rounded">
            <h4 className="font-bold">{version.versionString}</h4>
            <p>Status: {version.publishStatus}</p>
            {version.publishStatus !== PublishStatus.Published && (
              <button
                onClick={() => handlePublishVersion(version.version_id)}
                className="bg-green-500 text-white px-4 py-2 rounded mt-2"
              >
                Publish
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
