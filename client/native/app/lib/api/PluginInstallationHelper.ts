import { apiFetch } from "../apiClient";
import { AsyncResult } from "../structures/AsyncResult";
import { ErrorResponse } from "../structures/ErrorResponse";
import { Guid } from "../structures/Guid";

export enum InstallationStatus {
  Pending = 0,
  Installing = 1,
  Installed = 2,
  Used = 3,
  Failed = 4,
  Disabled = 5,
  Updating = 6,
  Uninstalled = 7,
}

export interface Plugin {
  id: Guid;
  title: string;
  description?: string;
  iconUrl: string;
  paymentType: number;
  platforms: number;
  price?: number;
  publishStatus: number;
  coreLanguage: number;
  verificationStatus: number;
  verificationNotes?: string;
  ageRating?: number;
  createdAt?: Date;
  updatedAt?: Date;
  isActive: boolean;
  ownerId: Guid;
}

export interface PluginVersion {
  id: Guid;
  pluginId: Guid;
  versionString: string;
  systemApiVersion: string;
  releaseNotes?: string;
  wasmBundleUrl: string;
  config: string;
  createdAt?: Date;
  updatedAt?: Date;
  isActive: boolean;
  isBeta: boolean;
  publishStatus: number;
  verificationStatus: number;
  verificationNotes?: string;
}

export interface PluginInstallation {
  installation_id: Guid;
  userId: Guid;
  pluginId: Guid;
  versionId: Guid;
  selectedLocalizationId?: Guid;
  createdAt?: Date;
  updatedAt?: Date;
  lastUsedAt?: Date;
}

export interface DeviceInstallation {
  id: Guid;
  installationId: Guid;
  deviceId: Guid;
  status: InstallationStatus;
  installedAt?: Date;
  updatedAt?: Date;
  lastUsedAt?: Date;
}

export interface InstallPluginRequest {
  pluginId: Guid;
  versionId: Guid;
  localizationId?: Guid;
  deviceId?: Guid;
}

export interface UpdateInstallationRequest {
  versionId?: Guid;
  localizationId?: Guid;
  deviceId?: Guid;
}

export interface UpdateDeviceInstallationStatusRequest {
  status: InstallationStatus;
}

interface PluginInstallationHelper {
  getInstallations: () => Promise<AsyncResult<PluginInstallation[]>>;
  getInstallation: (id: Guid) => Promise<AsyncResult<PluginInstallation>>;
  installPlugin: (
    request: InstallPluginRequest
  ) => Promise<AsyncResult<PluginInstallation>>;
  updateInstallation: (
    id: Guid,
    request: UpdateInstallationRequest
  ) => Promise<ErrorResponse | undefined>;
  uninstallPlugin: (id: Guid) => Promise<ErrorResponse | undefined>;
  getDeviceInstallations: (
    deviceId: Guid
  ) => Promise<AsyncResult<DeviceInstallation[]>>;
  updateDeviceInstallationStatus: (
    deviceId: Guid,
    installationId: Guid,
    request: UpdateDeviceInstallationStatusRequest
  ) => Promise<ErrorResponse | undefined>;
}

export const PluginInstallationAPI: PluginInstallationHelper = {
  async getInstallations() {
    const response = await apiFetch("/v1/plugins/installations", {
      credentials: "include",
    });

    if (response.status !== 200) return { error: await response.json() };
    return { result: await response.json() };
  },

  async getInstallation(id: Guid) {
    const response = await apiFetch(`/v1/plugins/installations/${btoa(id)}`, {
      credentials: "include",
    });

    if (response.status !== 200) return { error: await response.json() };
    return { result: await response.json() };
  },

  async installPlugin(request: InstallPluginRequest) {
    const response = await apiFetch("/v1/plugins/installations", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (response.status !== 200 && response.status !== 201)
      return { error: await response.json() };
    return { result: await response.json() };
  },

  async updateInstallation(id: Guid, request: UpdateInstallationRequest) {
    const response = await apiFetch(`/v1/plugins/installations/${btoa(id)}`, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (response.status !== 204) return await response.json();
  },

  async uninstallPlugin(id: Guid) {
    const response = await apiFetch(`/v1/plugins/installations/${btoa(id)}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (response.status !== 204) return await response.json();
  },

  async getDeviceInstallations(deviceId: Guid) {
    const response = await apiFetch(
      `/v1/plugins/installations/device/${btoa(deviceId)}`,
      {
        credentials: "include",
      }
    );

    if (response.status !== 200) return { error: await response.json() };
    return { result: await response.json() };
  },

  async updateDeviceInstallationStatus(
    deviceId: Guid,
    installationId: Guid,
    request: UpdateDeviceInstallationStatusRequest
  ) {
    const response = await apiFetch(
      `/v1/plugins/installations/device/${btoa(deviceId)}/${btoa(
        installationId
      )}/status`,
      {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      }
    );

    if (response.status !== 204) return await response.json();
  },
};
