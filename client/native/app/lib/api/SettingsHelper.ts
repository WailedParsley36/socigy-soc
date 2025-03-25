import { apiFetch } from "../apiClient";
import { ErrorResponse } from "../structures/ErrorResponse";

export enum AppComplexity {
  Simple,
  Normal,
  Complex,
}

interface SettingsHelper {
  setComplexity: (
    complexity: AppComplexity
  ) => Promise<ErrorResponse | undefined>;
}

export const SettingsAPI: SettingsHelper = {
  async setComplexity(complexity: AppComplexity) {
    const response = await apiFetch(
      `/v1/user/settings/complexity?complexity=${complexity}`,
      {
        credentials: "include",
      }
    );
    if (response.status != 200) return await response.json();
  },
};
