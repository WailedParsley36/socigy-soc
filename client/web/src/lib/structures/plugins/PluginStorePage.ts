import { Guid } from "../Guid";

export enum PlatformType {
  All = 0,
  Mobile = 1,
  Tv = 2,
  Car = 4,
  Watch = 8,
  Desktop = 16,
  Web = 32,

  Android = 64,
  IOS = 128,
  Windows = 256,
  Linux = 512,
}
export enum PaymentType {
  Free,
  OneTime,
  Subscription,
}
export enum VerificationStatus {
  Unverified,
  Pending,
  Verified,
  Malicious,
}

export enum PluginLanguage {
  Rust,
}

export interface PluginRecommendation {
  plugin_id: Guid;
  title: string;
  description?: string;

  iconUrl?: string;
  platforms: PlatformType;

  paymentType: PaymentType;
  price?: number;
  currency?: string;

  verificationStatus: VerificationStatus;
  ageRating: number;

  createdAt: Date;
  categories: Guid[];
  tags: Guid[];
  reviewCount: number;
  averageRating: number;
  installationCount: number;
}

export interface PluginStorePage {
  hot: PluginRecommendation[];
  newArrivals: PluginRecommendation[];
  staffPicks: PluginRecommendation[];
  recommendedForYou: PluginRecommendation[];
}
