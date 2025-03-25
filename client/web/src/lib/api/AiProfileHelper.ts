import { AsyncResult } from "../structures/AsyncResult";
import { apiFetch } from "../apiClient";
import { Guid } from "../structures/Guid";
import Category, { CategoryPreference } from "../structures/content/Category";
import Interest, { InterestPreference } from "../structures/content/Interest";

export enum ContentProfileVisibility {
  Private,
  Public,
  CirclesOnly,
  CustomCircles,
}

export interface ContentProfileRequest {
  id?: Guid;
  name?: string;
  description?: string;
  visibility?: ContentProfileVisibility;
}

export interface CreateContentProfileResponse {
  newId: Guid;
}

export interface UserContentProfile {
  id: Guid;
  name: string;
  description: string;
  isDefault: boolean;
  owner: Guid;
  visibility: ContentProfileVisibility;
}

export interface SetProfileContentPreferencesRequest {
  preferences: CategoryPreference[] | InterestPreference[];
}

// Helper function to encode profile ID
const encodeProfileId = (profileId: Guid): string => {
  return btoa(profileId);
};

// ContentProfileHelper
export const ContentProfileHelper = {
  // Categories and Interests
  async getPreferredCategories(
    profileId: Guid,
    limit: number = 15,
    offset: number = 0
  ): Promise<AsyncResult<Category[]>> {
    const encodedProfileId = encodeProfileId(profileId);
    const response = await apiFetch(
      `/v1/content/profiles/${encodedProfileId}/categories?limit=${limit}&offset=${offset}`
    );
    if (response.status !== 200) return { error: await response.json() };
    return { result: await response.json() };
  },

  async getPreferredInterests(
    profileId: Guid,
    limit: number = 15,
    offset: number = 0
  ): Promise<AsyncResult<Interest[]>> {
    const encodedProfileId = encodeProfileId(profileId);
    const response = await apiFetch(
      `/v1/content/profiles/${encodedProfileId}/interests?limit=${limit}&offset=${offset}`
    );
    if (response.status !== 200) return { error: await response.json() };
    return { result: await response.json() };
  },

  async updatePreferredCategories(
    profileId: Guid,
    preferences: CategoryPreference[]
  ): Promise<AsyncResult<void>> {
    const encodedProfileId = encodeProfileId(profileId);
    const response = await apiFetch(
      `/v1/content/profiles/${encodedProfileId}/categories`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences }),
      }
    );
    if (response.status !== 200) return { error: await response.json() };
    return { result: undefined };
  },

  async updatePreferredInterests(
    profileId: Guid,
    preferences: InterestPreference[]
  ): Promise<AsyncResult<void>> {
    const encodedProfileId = encodeProfileId(profileId);
    const response = await apiFetch(
      `/v1/content/profiles/${encodedProfileId}/interests`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences }),
      }
    );
    if (response.status !== 200) return { error: await response.json() };
    return { result: undefined };
  },

  async setPreferredCategories(
    profileId: Guid,
    preferences: CategoryPreference[]
  ): Promise<AsyncResult<void>> {
    const encodedProfileId = encodeProfileId(profileId);
    const response = await apiFetch(
      `/v1/content/profiles/${encodedProfileId}/categories`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences }),
      }
    );
    if (response.status !== 200) return { error: await response.json() };
    return { result: undefined };
  },

  async setPreferredInterests(
    profileId: Guid,
    preferences: InterestPreference[]
  ): Promise<AsyncResult<void>> {
    const encodedProfileId = encodeProfileId(profileId);
    const response = await apiFetch(
      `/v1/content/profiles/${encodedProfileId}/interests`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences }),
      }
    );
    if (response.status !== 200) return { error: await response.json() };
    return { result: undefined };
  },

  async deletePreferredCategories(profileId: Guid): Promise<AsyncResult<void>> {
    const encodedProfileId = encodeProfileId(profileId);
    const response = await apiFetch(
      `/v1/content/profiles/${encodedProfileId}/categories`,
      {
        method: "DELETE",
      }
    );
    if (response.status !== 200) return { error: await response.json() };
    return { result: undefined };
  },

  async deletePreferredInterests(profileId: Guid): Promise<AsyncResult<void>> {
    const encodedProfileId = encodeProfileId(profileId);
    const response = await apiFetch(
      `/v1/content/profiles/${encodedProfileId}/interests`,
      {
        method: "DELETE",
      }
    );
    if (response.status !== 200) return { error: await response.json() };
    return { result: undefined };
  },

  // Content Profiles
  async createContentProfile(
    request: ContentProfileRequest
  ): Promise<AsyncResult<CreateContentProfileResponse>> {
    const response = await apiFetch("/v1/content/profiles/create", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    if (response.status !== 200) return { error: await response.json() };
    return { result: await response.json() };
  },

  async deleteContentProfile(id: Guid): Promise<AsyncResult<void>> {
    const response = await apiFetch("/v1/content/profiles/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (response.status !== 200) return { error: await response.json() };
    return { result: undefined };
  },

  async editContentProfile(
    request: ContentProfileRequest
  ): Promise<AsyncResult<void>> {
    const response = await apiFetch("/v1/content/profiles/edit", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    if (response.status !== 200) return { error: await response.json() };
    return { result: undefined };
  },

  // Queries
  async getPopularCategories(
    limit: number = 32,
    offset: number = 0
  ): Promise<AsyncResult<Category[]>> {
    const response = await apiFetch(
      `/v1/content/categories/popular?limit=${limit}&offset=${offset}`
    );
    if (response.status !== 200) return { error: await response.json() };
    return { result: await response.json() };
  },

  async getPopularInterests(
    limit: number = 32,
    offset: number = 0
  ): Promise<AsyncResult<Interest[]>> {
    const response = await apiFetch(
      `/v1/content/interests/popular?limit=${limit}&offset=${offset}`
    );
    if (response.status !== 200) return { error: await response.json() };
    return { result: await response.json() };
  },

  async getRecommendedInterests(
    profileId: Guid,
    limit: number = 32,
    offset: number = 0
  ): Promise<AsyncResult<Interest[]>> {
    const encodedProfileId = encodeProfileId(profileId);
    const response = await apiFetch(
      `/v1/content/interests/recommend/${encodedProfileId}?limit=${limit}&offset=${offset}`
    );
    if (response.status !== 200) return { error: await response.json() };
    return { result: await response.json() };
  },

  // Registration
  async registerDefaultPrefferedCategories(
    preferences: CategoryPreference[]
  ): Promise<AsyncResult<void>> {
    const response = await apiFetch("/v1/content/register/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preferences }),
    });
    if (response.status !== 200) return { error: await response.json() };
    return { result: undefined };
  },

  async getDefaultPrefferedCategories(
    limit: number = 32,
    offset: number = 0
  ): Promise<AsyncResult<CategoryPreference[]>> {
    const response = await apiFetch(
      `/v1/content/register/categories?limit=${limit}&offset=${offset}`
    );
    if (response.status !== 200) return { error: await response.json() };
    return { result: await response.json() };
  },

  async getDefaultRecommendedInterests(
    limit: number = 32,
    offset: number = 0
  ): Promise<AsyncResult<Interest[]>> {
    const response = await apiFetch(
      `/v1/content/register/interests/recommend?limit=${limit}&offset=${offset}`
    );
    if (response.status !== 200) return { error: await response.json() };
    return { result: await response.json() };
  },

  async registerDefaultPrefferedInterests(
    preferences: InterestPreference[]
  ): Promise<AsyncResult<void>> {
    const response = await apiFetch("/v1/content/register/interests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preferences }),
    });
    if (response.status !== 200) return { error: await response.json() };
    return { result: undefined };
  },

  async getDefaultPrefferedInterests(
    limit: number = 32,
    offset: number = 0
  ): Promise<AsyncResult<InterestPreference[]>> {
    const response = await apiFetch(
      `/v1/content/register/interests?limit=${limit}&offset=${offset}`
    );
    if (response.status !== 200) return { error: await response.json() };
    return { result: await response.json() };
  },
};
