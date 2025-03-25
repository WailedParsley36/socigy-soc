import { Guid } from "../../Guid";

export enum ContentType {
  Take,
  Frame,
  FullFrame,
  Music,
  Podcast,
  Quote,
  Discussion,
  Blog,
  News,
  Poll,
  Video,
  LiveTake,
  LivePodcast,
  Stream,
}

export interface RecommendationRequest {
  contentTypes?: ContentType[];

  contentProfile?: Guid;

  postedBefore?: Date;
  postedAfter?: Date;

  creatorIds?: Guid[];
  categoryIds?: Guid[];
  interestIds?: Guid[];
  excludedCreatorIds?: Guid[];
  excludedCategoryIds?: Guid[];
  excludedInterestIds?: Guid[];

  limit: number;
  offset: number;

  search?: string;
  targetUserId?: Guid;
}
