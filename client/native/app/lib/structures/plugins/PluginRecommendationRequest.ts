import { Guid } from "../Guid";

export interface PluginRecommendationRequest {
  search?: string;
  ownerId?: Guid;
  categoryIds?: Guid[];
  excludedCategoryIds?: Guid[];
  creatorIds?: Guid[];
  excludedCreatorIds?: Guid[];
  postedAfter?: Date;
  postedBefore?: Date;
  minVerificationStatuses?: VerificationStatus[];
  pluginLanguages?: PluginCoreLanguage[];
  regionCodes?: string[];
  minAgeRating?: number;
  maxAgeRating?: number;
  paymentType?: number;
  platforms?: number;
  activeOnly?: boolean;
  publishStatuses?: PublishStatus[];
  limit: number;
  offset: number;
}

export enum VerificationStatus {
  Unverified,
  Pending,
  Verified,
  Malicious,
}

export enum PublishStatus {
  Preparing,
  Reviewing,
  Published,
  TakenDown,
}
export enum PluginCoreLanguage {
  Rust,
}
