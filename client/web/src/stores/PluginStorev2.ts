"use client";

import VersionManager from "@/components/plugins/dev/VersionManager";
import { BASE_API_URL } from "@/constants";
import { PluginAPI, PluginVersion } from "@/lib/api/PluginAPI";
import {
  PluginInstallation,
  PluginInstallationAPI,
} from "@/lib/api/PluginInstallationHelper";
import { apiFetch, includeRequiredHeaders } from "@/lib/apiClient";
import {
  base64,
  base64ToGuid,
  createCredential,
  guidToBytes,
} from "@/lib/PasskeyHelper";
import { AsyncResult } from "@/lib/structures/AsyncResult";
import {
  userDisplayName,
  UserShallowInfo,
} from "@/lib/structures/content/posts/RecommendedPost";
import { Sex } from "@/lib/structures/Enums";
import { ErrorResponse } from "@/lib/structures/ErrorResponse";
import { Guid } from "@/lib/structures/Guid";
import { TokenResponse } from "@/lib/structures/responses/TokenResponse";
import { User } from "@/lib/structures/User";
import { error } from "console";
import { pl } from "date-fns/locale";
import { stat } from "fs";
import { useEffect, useState } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import SystemApiV1 from "./system-apis/v1";
import { SystemApiType, Versions } from "./system-apis/exports";

export interface PluginStore {
  isInitialized: boolean;
  installations: { installation: PluginInstallation; version: PluginVersion }[];
  systemApis: { [version: string]: SystemApiType };

  initialize: () => Promise<void>;
  isInstalled: (pluginId: Guid) => boolean;

  installPlugin: (
    pluginId: Guid,
    versionId: Guid
  ) => Promise<PluginInstallation>;
  uninstallPlugin: (installationId: Guid) => Promise<void>;
}

export const usePluginStore = create<PluginStore>()(
  persist(
    (set, get) => ({
      isInitialized: false,
      installations: [],
      systemApis: {},

      async initialize() {
        const installationResponse =
          await PluginInstallationAPI.getInstallations();
        if (installationResponse.error)
          throw new Error("Failed to initialize PluginStore");

        // TODO: Optimalization - Make an API endpoint to get the versions + installations at once
        const currentInstallations = get().installations;
        const missingInstallations = [];
        const notMissing = installationResponse.result?.every((x) => {
          const result = currentInstallations.some(
            (y) => x.installation_id == y.installation.installation_id
          );

          if (!result) missingInstallations.push(x);
          return result;
        });

        if (notMissing) {
          // @ts-ignore
          get().initializeInstalledPlugins();
          return;
        }
      },
      // TODO: Web plugin translation is in active development
      initializeInstalledPlugins() {
        get().installations.forEach((x) => {
          const moduleData = localStorage.getItem(
            `${x.installation.pluginId}-${x.version.version_id}`
          );

          // @ts-ignore
          const api = get().getSystemApi(x.version.versionString);
          if (moduleData) {
            // api.
          }
        });
      },
      getSystemApi(version: string) {
        let api = this.systemApis[version];
        if (!api) {
          // @ts-ignore
          api = Versions[version]();
          this.systemApis[version] = api;
        }

        return api;
      },

      isInstalled(pluginId: Guid) {
        return this.installations.some(
          (x) => x.installation.pluginId == pluginId
        );
      },
      async installPlugin(pluginId: Guid, versionId: Guid) {
        const installation = await PluginInstallationAPI.installPlugin({
          pluginId: pluginId,
          versionId: versionId,
        });
        if (installation.error) throw new Error(installation.error.message);

        const version = await PluginAPI.getPluginVersionDetails(
          installation.result!.pluginId,
          installation.result!.versionId
        );
        if (version.error) throw new Error(version.error.message);

        set({
          installations: [
            ...get().installations,
            { installation: installation.result!, version: version.result! },
          ],
        });

        console.log("INSTALLING");

        return installation.result!;
      },
      async uninstallPlugin(installationId) {
        const error = await PluginInstallationAPI.uninstallPlugin(
          installationId
        );
        if (error) throw new Error(error.message);

        console.log("UNINSTALLING");
      },
    }),
    {
      name: "plugins-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        installations: state.installations,
      }),
    }
  )
);

export default function useAwaitedAuthStore() {
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const plugins = usePluginStore();

  useEffect(() => {
    if (plugins.isInitialized) setIsLoaded(true);
  }, [plugins]);

  return { isLoaded: isLoaded, plugins: plugins };
}
