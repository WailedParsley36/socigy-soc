import { Guid } from "../../Guid";
import { ContentType } from "./RecommendationRequest";

export enum VisibilityType {
  Public,
  AllCircles,
  CustomCircles,
}

export enum PublishStatus {
  Draft,
  Scheduled,
  Published,
  Archived,
}

export enum MediaType {
  Image,
  Video,
  Audio,
  Document,
  Other,
}

export function userDisplayName(user: UserShallowInfo) {
  if (user) return `${user.username} #${user.tag}`;
  return "";
}

export interface UserShallowInfo {
  id?: Guid;
  username: string;
  tag: number;
  iconUrl: string;

  displayName: string;
}

export type UserRegistry = { [id: Guid]: UserShallowInfo };
export interface RecommendedPostsResponse {
  users: UserRegistry;
  posts: RecommendedPost[];
}

export interface RecommendedPostComment {
  id: Guid;
  userId: Guid;

  parentCommentId?: Guid;

  content: string;

  createdAt: Date;
  updatedAt: Date;
}

export interface RecommendedPostMedia {
  mediaType: MediaType;
  url: string;
  thumbnailUrl: string;
  position: number;
  metadata: string;
}

export interface RecommendedPost {
  id: Guid;
  userId: Guid;

  comments?: RecommendedPostComment[];
  media?: RecommendedPostMedia[];

  contentType: ContentType;

  title?: string;
  content?: string;
  externalUrl?: string;

  visibility: VisibilityType;
  publishStatus: PublishStatus;

  isScheduled: boolean;
  isRecurring: boolean;

  scheduledFor?: Date;
  scheduledAt?: Date;

  metadata?: string;

  updatedAt?: Date;

  postPopularity: number;
  categoryPopularity: number;
  interestPopularity: number;

  userInterestWeight: number;

  likesCount: number;
  dislikesCount: number;
  sharesCount: number;
  viewsCount: number;
  commentsCount: number;
  totalComments: number;

  isLikedByMe: boolean;
  isDislikedByMe: boolean;
  isSharedByMe: boolean;
  isCommentedByMe: boolean;
}
