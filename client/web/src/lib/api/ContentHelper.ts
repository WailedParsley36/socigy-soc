import { off } from "process";
import { apiFetch } from "../apiClient";
import { AsyncResult } from "../structures/AsyncResult";
import Category, { CategoryPreference } from "../structures/content/Category";
import Interest, { InterestPreference } from "../structures/content/Interest";
import { ErrorResponse } from "../structures/ErrorResponse";
import { Guid } from "../structures/Guid";

export enum InteractionType {
  View = 0,
  Like = 1,
  Dislike = 2,
  Share = 3,
  Comment = 4,
  Save = 5,
  Report = 6,
}

export interface VoteRequest {
  pollId: Guid;
  pollOptionIds: Guid[];
}

export interface InteractionRequest {
  postId: Guid;
  type: InteractionType;
  viewSeconds?: number;
}

export interface CommentRequest {
  postId: Guid;
  content: string;
  parentCommentId?: Guid;
}

export interface Comment {
  id: Guid;
  postId: Guid;
  userId: Guid;
  content: string;
  parentCommentId?: Guid;
  createdAt: Date;
  updatedAt: Date;
}

interface ContentHelper {
  getPopularCategories: (
    limit?: number,
    offset?: number
  ) => Promise<AsyncResult<Category[]>>;
  getPopularInterests: (
    limit?: number,
    offset?: number
  ) => Promise<AsyncResult<Interest[]>>;
  getRecommendedInterests: (
    profileId?: Guid,
    limit?: number,
    offset?: number
  ) => Promise<AsyncResult<Interest[]>>;

  setPrefferedCategories: (
    profileId: Guid,
    categoryIds: CategoryPreference[]
  ) => Promise<AsyncResult<Guid>>;
  setPrefferedInterests: (
    profileId: Guid,
    interestIds: InterestPreference[]
  ) => Promise<AsyncResult<Guid>>;

  registerDefaultPrefferedCategories: (
    categoryIds: CategoryPreference[]
  ) => Promise<ErrorResponse | undefined>;
  registerDefaultPrefferedInterests: (
    interestIds: InterestPreference[]
  ) => Promise<ErrorResponse | undefined>;

  addInteraction: (
    interaction: InteractionRequest
  ) => Promise<ErrorResponse | void>;
  removeInteraction: (
    interaction: InteractionRequest
  ) => Promise<ErrorResponse | void>;
  addComment: (comment: CommentRequest) => Promise<AsyncResult<Comment>>;
  getComments: (
    postId: Guid,
    nested?: boolean,
    limit?: number,
    offset?: number
  ) => Promise<AsyncResult<Comment[]>>;
  getCommentComments: (
    postId: Guid,
    commentId: Guid,
    nested?: boolean,
    limit?: number,
    offset?: number
  ) => Promise<AsyncResult<Comment[]>>;
  votePoll: (vote: VoteRequest) => Promise<ErrorResponse | void>;
  deleteVote: (vote: VoteRequest) => Promise<ErrorResponse | void>;
}

export const ContentAPI: ContentHelper = {
  async getPopularCategories(limit?: number, offset?: number) {
    const response = await apiFetch(
      `/v1/content/categories/popular?limit=${limit ?? 15}&offset=${
        offset ?? 0
      }`,
      {
        credentials: "include",
      }
    );
    if (response.status != 200) return { error: await response.json() };

    return { result: await response.json() };
  },
  async getPopularInterests(limit?: number, offset?: number) {
    const response = await apiFetch(
      `/v1/content/interests/popular?limit=${limit ?? 15}&offset=${
        offset ?? 0
      }`,
      {
        credentials: "include",
      }
    );
    if (response.status != 200) return { error: await response.json() };

    return { result: await response.json() };
  },

  async setPrefferedCategories(
    profileId: Guid,
    categories: CategoryPreference[]
  ) {
    const response = await apiFetch(
      `/v1/content/profiles/${btoa(profileId)}/categories`,
      {
        method: "POST",
        body: JSON.stringify({
          preferences: categories,
        }),
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    if (response.status != 200) return await response.json();
  },
  async setPrefferedInterests(
    profileId: string,
    interests: InterestPreference[]
  ) {
    const response = await apiFetch(
      `/v1/content/profiles/${btoa(profileId)}/interests`,
      {
        method: "POST",
        body: JSON.stringify({
          preferences: interests,
        }),
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    if (response.status != 200) return await response.json();
  },

  async registerDefaultPrefferedCategories(categories: CategoryPreference[]) {
    console.log("Selected:", categories);

    const response = await apiFetch(`/v1/content/register/categories`, {
      method: "POST",
      body: JSON.stringify({
        preferences: categories,
      }),
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.status != 200) return await response.json();
  },
  async registerDefaultPrefferedInterests(interests: InterestPreference[]) {
    const response = await apiFetch(`/v1/content/register/interests`, {
      method: "POST",
      body: JSON.stringify({
        preferences: interests,
      }),
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.status != 200) return await response.json();
  },
  async getRecommendedInterests(
    profileId?: Guid,
    limit?: number,
    offset?: number
  ) {
    let response;
    if (!profileId) {
      response = await apiFetch(
        `/v1/content/register/interests/recommend?limit=${limit ?? 15}&offset=${
          offset ?? 0
        }`,
        {
          credentials: "include",
        }
      );
    } else {
      response = await apiFetch(
        `/v1/content/interests/recommend/${btoa(profileId)}?limit=${
          limit ?? 15
        }&offset=${offset ?? 0}`,
        {
          credentials: "include",
        }
      );
    }

    if (response.status != 200) return { error: await response.json() };

    return { result: await response.json() };
  },

  async addInteraction(interaction: InteractionRequest) {
    const response = await apiFetch("/v1/content/interactions/add", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(interaction),
    });
    if (response.status != 200) return await response.json();
  },

  async removeInteraction(interaction: InteractionRequest) {
    const response = await apiFetch("/v1/content/interactions/remove", {
      method: "DELETE",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(interaction),
    });
    if (response.status != 200) return await response.json();
  },

  async addComment(comment: CommentRequest) {
    const response = await apiFetch("/v1/content/interactions/comment", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(comment),
    });
    if (response.status != 200) return { error: await response.json() };

    return { result: await response.json() };
  },

  async getComments(
    postId: Guid,
    nested: boolean = false,
    limit: number = 15,
    offset: number = 0
  ) {
    const response = await apiFetch(
      `/v1/content/interactions/comments/${postId}?nested=${nested}&limit=${limit}&offset=${offset}`,
      {
        credentials: "include",
      }
    );
    if (response.status != 200) return { error: await response.json() };

    return { result: await response.json() };
  },

  async getCommentComments(
    postId: Guid,
    commentId: Guid,
    nested: boolean = false,
    limit: number = 15,
    offset: number = 0
  ) {
    const response = await apiFetch(
      `/v1/content/interactions/comments/${postId}/${commentId}?nested=${nested}&limit=${limit}&offset=${offset}`,
      {
        credentials: "include",
      }
    );
    if (response.status != 200) return { error: await response.json() };

    return { result: await response.json() };
  },

  async votePoll(vote: VoteRequest) {
    const response = await apiFetch("/v1/content/interactions/vote", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(vote),
    });
    if (response.status != 200) return await response.json();
  },

  async deleteVote(vote: VoteRequest) {
    const response = await apiFetch("/v1/content/interactions/vote", {
      method: "DELETE",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(vote),
    });
    if (response.status != 200) return await response.json();
  },
};
