import { apiFetch, includeRequiredHeaders } from "../apiClient";
import { AsyncResult } from "../structures/AsyncResult";
import {
  createPostFormData,
  PostUploadData,
} from "../structures/content/posts/PostUploadData";
import { RecommendationRequest } from "../structures/content/posts/RecommendationRequest";
import {
  RecommendedPost,
  RecommendedPostsResponse,
  userDisplayName,
} from "../structures/content/posts/RecommendedPost";
import { ErrorResponse } from "../structures/ErrorResponse";
import { Guid } from "../structures/Guid";

export enum InteractionType {
  View,
  Like,
  Dislike,
  Share,
  Comment,
  Save,
  Report,
}

interface PostHelper {
  recommendPosts: (
    options: RecommendationRequest
  ) => Promise<AsyncResult<RecommendedPostsResponse>>;
  queryPosts: (
    options: RecommendationRequest
  ) => Promise<AsyncResult<RecommendedPost[]>>;

  uploadPost: (data: PostUploadData) => Promise<AsyncResult<Guid>>;
}

export const PostAPI: PostHelper = {
  async recommendPosts(options: RecommendationRequest) {
    const response = await apiFetch("/v1/content/recommend", {
      method: "POST",
      credentials: "include",
      body: JSON.stringify(options),
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.status != 200) return { error: await response.json() };

    const result = {
      result: (await response.json()) as RecommendedPostsResponse,
    };
    Object.keys(result.result.users).forEach((x: string) => {
      result.result.users[x as Guid].displayName = userDisplayName(
        result.result.users[x as Guid]
      );
    });
    return result;
  },

  async queryPosts(options: RecommendationRequest) {
    const response = await apiFetch("/v1/content/query", {
      method: "POST",
      credentials: "include",
      body: JSON.stringify(options),
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.status != 200) return { error: await response.json() };

    return { result: await response.json() };
  },
  async uploadPost(data: PostUploadData) {
    const response = await apiFetch("/v1/content/upload", {
      method: "POST",
      credentials: "include",
      body: createPostFormData(data),
    });
    if (response.status != 200) return { error: await response.json() };

    return { result: await response.json() };
  },
};
