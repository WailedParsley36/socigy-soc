import { apiFetch } from "../apiClient";
import { AsyncResult } from "../structures/AsyncResult";
import { Guid } from "../structures/Guid";
import { ErrorResponse } from "../structures/ErrorResponse";

export enum PublishStatus {
  Preparing,
  Reviewing,
  Published,
  TakenDown,
}

export enum VerificationStatus {
  Unverified,
  Pending,
  Verified,
  Malicious,
}

export enum PaymentType {
  Free = 0,
  OneTime = 1,
}

export enum PlatformType {
  Web = 1,
  Mobile = 2,
  Desktop = 4,
  All = 7,
}

export enum PluginCoreLanguage {
  Rust = 0,
  // Add other languages as needed
}

export enum ReviewReportReason {
  Spam = 0,
  Inappropriate = 1,
  Misleading = 2,
  Other = 3,
}

// Request Interfaces
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
  paymentType?: PaymentType;
  platforms?: PlatformType;
  activeOnly?: boolean;
  publishStatuses?: PublishStatus[];
  sortBy?: string;
  sortDirection?: string;
  limit?: number;
  offset?: number;
}

export interface CreatePluginRequest {
  title: string;
  description?: string;
  paymentType: PaymentType;
  price?: number;
  platforms: PlatformType;
  icon: File;
}

export interface CreatePluginVersionRequest {
  config?: File;
  module?: File;
  versionString: string;
  systemApiVersion: string;
  releaseNotes?: string;
  isActive?: boolean;
  isBeta?: boolean;
}

export interface ReviewPluginVersionRequest {
  reviewNotes?: string;
  isOk: boolean;
}

export interface PluginReportRequest {
  reasonType: ReviewReportReason;
  reasonText: string;
  versionId?: Guid;
}

export interface PluginReviewReportRequest {
  reasonType: ReviewReportReason;
  reasonText: string;
}

export interface ReviewRequest {
  rating: number;
  reviewText: string;
}

export interface EditLocalizationDataRequest {
  regionCode?: string;
  content?: string;
}

export interface AddPluginDbKeyRequest {
  data: string;
  removeAtUninstall?: boolean;
}

// Response Interfaces
export interface PluginRecommendation {
  plugin_id: Guid;
  title: string;
  description?: string;
  iconUrl?: string;
  platforms: PlatformType;
  paymentType: PaymentType;
  publishStatus: PublishStatus; // TODO: Return this from API
  price?: number;
  currency?: string;
  verificationStatus: VerificationStatus;
  ageRating: number;
  createdAt: Date;
  categories?: Guid[];
  tags?: Guid[];
  reviewCount: number;
  avgRating: number;
  installationCount: number;

  developerEmail?: string;
  developerUsername?: string;
  developerIconUrl?: string;
  developerTag?: number;
}

export interface PluginConfigPermission {
  link: string;
  required: boolean;
  description?: string;
  componentIds?: Guid[];
}

export interface PluginConfig {
  permissions: { [id: string]: PluginConfigPermission };
}

export interface PluginVersion {
  version_id: Guid;
  pluginId: Guid;
  versionString: string;
  systemApiVersion: string;
  releaseNotes?: string;
  language: string;
  config?: string;
  parsedConfig: PluginConfig;
  wasmBundleUrl?: string;
  isActive: boolean;
  isBeta: boolean;
  publishStatus: PublishStatus;
  verificationStatus: VerificationStatus;
  verificationNotes?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface PluginAsset {
  asset_id: Guid;
  pluginId: Guid;
  assetKey: string;
  assetUrl: string;
  mediaType: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface LocalizationData {
  localization_id: Guid;
  pluginId: Guid;
  regionCode: string;
  localizedText: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface PluginReview {
  review_id: Guid;
  pluginId: Guid;
  userId: Guid;
  rating: number;

  username: string;
  tag: number;
  iconUrl: string;

  reviewText: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface PluginStorePageResponse {
  hot: PluginRecommendation[];
  newArrivals: PluginRecommendation[];
  staffPicks: PluginRecommendation[];
  recommendedForYou: PluginRecommendation[];
}

export interface CheckPluginDbStatsResponse {
  rowMaxLimit: number;
  sizeMaxLimit: number;
  totalRows: number;
  occupiedSize: number;
}

export interface PluginDbDataRowResponse {
  pluginId: Guid;
  key: string;
  data: string;
  createdAt?: Date;
  updatedAt?: Date;
}

function encodeId(id: Guid): string {
  return btoa(id);
}

export interface PluginHelper {
  // Query
  queryPlugins: (
    options: PluginRecommendationRequest
  ) => Promise<AsyncResult<PluginRecommendation[]>>;

  // Store
  getStorePage: () => Promise<AsyncResult<PluginStorePageResponse>>;
  getHotPlugins: (
    options: PluginRecommendationRequest
  ) => Promise<AsyncResult<PluginRecommendation[]>>;
  getNewArrivalsPlugins: (
    options: PluginRecommendationRequest
  ) => Promise<AsyncResult<PluginRecommendation[]>>;
  getStaffPicksPlugins: (
    options: PluginRecommendationRequest
  ) => Promise<AsyncResult<PluginRecommendation[]>>;
  getRecommendedForYouPlugins: (
    options: PluginRecommendationRequest
  ) => Promise<AsyncResult<PluginRecommendation[]>>;
  getPluginDetails: (
    pluginId: Guid
  ) => Promise<AsyncResult<PluginRecommendation>>;
  getPluginVersions: (pluginId: Guid) => Promise<AsyncResult<PluginVersion[]>>;
  getPluginVersionDetails: (
    pluginId: Guid,
    versionId: Guid
  ) => Promise<AsyncResult<PluginVersion>>;
  reportPlugin: (
    pluginId: Guid,
    report: PluginReportRequest
  ) => Promise<AsyncResult<void>>;

  // Reviews
  listPluginReviews: (
    pluginId: Guid,
    limit?: number,
    offset?: number
  ) => Promise<AsyncResult<PluginReview[]>>;
  addOrEditPluginReview: (
    pluginId: Guid,
    review: ReviewRequest
  ) => Promise<AsyncResult<PluginReview>>;
  removePluginReview: (pluginId: Guid) => Promise<AsyncResult<void>>;
  reportPluginReview: (
    pluginId: Guid,
    reviewId: Guid,
    report: PluginReviewReportRequest
  ) => Promise<AsyncResult<void>>;

  // Plugin Management
  createPlugin: (
    data: CreatePluginRequest
  ) => Promise<AsyncResult<PluginRecommendation>>;
  editPlugin: (
    pluginId: Guid,
    data: Partial<CreatePluginRequest>
  ) => Promise<AsyncResult<void>>;
  deletePlugin: (pluginId: Guid) => Promise<AsyncResult<void>>;

  // Assets
  getPluginAssets: (
    pluginId: Guid,
    limit?: number,
    offset?: number
  ) => Promise<AsyncResult<PluginAsset[]>>;
  cachePluginAssets: (
    pluginId: Guid,
    limit?: number,
    offset?: number
  ) => Promise<AsyncResult<PluginAsset[]>>;
  uploadPluginAssets: (
    pluginId: Guid,
    files: File[],
    keys: string[]
  ) => Promise<AsyncResult<PluginAsset[]>>;
  editPluginAsset: (
    pluginId: Guid,
    assetId: Guid,
    file?: File,
    assetKey?: string
  ) => Promise<AsyncResult<void>>;
  removePluginAssets: (
    pluginId: Guid,
    assetIds: Guid[]
  ) => Promise<AsyncResult<void>>;
  setPluginAssetAsStoreAsset: (
    pluginId: Guid,
    assetId: Guid,
    position?: number
  ) => Promise<AsyncResult<void>>;
  editPluginAssetAsStoreAsset: (
    pluginId: Guid,
    assetId: Guid,
    position?: number
  ) => Promise<AsyncResult<void>>;
  removePluginAssetAsStoreAsset: (
    pluginId: Guid,
    assetId: Guid
  ) => Promise<AsyncResult<void>>;

  // Localizations
  getPluginLocalizations: (
    pluginId: Guid
  ) => Promise<AsyncResult<LocalizationData[]>>;
  addPluginLocalization: (
    pluginId: Guid,
    regionCode: string,
    localizedText: string
  ) => Promise<AsyncResult<LocalizationData>>;
  editPluginLocalization: (
    pluginId: Guid,
    localizationId: Guid,
    data: EditLocalizationDataRequest
  ) => Promise<AsyncResult<LocalizationData>>;
  removePluginLocalizations: (
    pluginId: Guid,
    localizationIds: Guid[]
  ) => Promise<AsyncResult<void>>;

  // Plugin DB
  getPluginDbKeyDetails: (
    pluginId: Guid,
    dataKey: string
  ) => Promise<AsyncResult<PluginDbDataRowResponse>>;
  getPluginDbKeyValue: (
    pluginId: Guid,
    dataKey: string
  ) => Promise<AsyncResult<any>>;
  addPluginDbKeyDetails: (
    pluginId: Guid,
    dataKey: string,
    data: AddPluginDbKeyRequest
  ) => Promise<AsyncResult<void>>;
  deletePluginDbKey: (
    pluginId: Guid,
    dataKey: string
  ) => Promise<AsyncResult<void>>;
  listPluginDbKeys: (
    pluginId: Guid,
    limit?: number,
    offset?: number
  ) => Promise<AsyncResult<PluginDbDataRowResponse[]>>;
  getPluginStorageLimits: (
    pluginId: Guid
  ) => Promise<AsyncResult<CheckPluginDbStatsResponse>>;

  // User DB
  getPluginUserDbKeyDetails: (
    pluginId: Guid,
    dataKey: string
  ) => Promise<AsyncResult<PluginDbDataRowResponse>>;
  getPluginUserDbKeyValue: (
    pluginId: Guid,
    dataKey: string
  ) => Promise<AsyncResult<any>>;
  addPluginUserDbKeyDetails: (
    pluginId: Guid,
    dataKey: string,
    data: AddPluginDbKeyRequest
  ) => Promise<AsyncResult<void>>;
  deletePluginUserDbKey: (
    pluginId: Guid,
    dataKey: string
  ) => Promise<AsyncResult<void>>;
  deletePluginUserAllDbKeys: (pluginId: Guid) => Promise<AsyncResult<void>>;
  getPluginUserStorageLimits: (
    pluginId: Guid
  ) => Promise<AsyncResult<CheckPluginDbStatsResponse>>;

  // Versions
  createPluginVersion: (
    pluginId: Guid,
    data: CreatePluginVersionRequest
  ) => Promise<AsyncResult<PluginVersion>>;
  editPluginVersion: (
    pluginId: Guid,
    versionId: Guid,
    data: Partial<CreatePluginVersionRequest>
  ) => Promise<AsyncResult<PluginVersion>>;
  removePluginVersion: (
    pluginId: Guid,
    versionId: Guid
  ) => Promise<AsyncResult<void>>;
  publishPluginVersion: (
    pluginId: Guid,
    versionId: Guid
  ) => Promise<AsyncResult<void>>;
  reviewPluginVersion: (
    pluginId: Guid,
    versionId: Guid,
    data: ReviewPluginVersionRequest
  ) => Promise<AsyncResult<void>>;

  // Logs
  logPluginLog: (pluginId: Guid, logData: any) => Promise<AsyncResult<void>>;
  queryPluginLogs: (pluginId: Guid) => Promise<AsyncResult<any[]>>;
}

export const PluginAPI: PluginHelper = {
  // Query
  async queryPlugins(options: PluginRecommendationRequest) {
    const response = await apiFetch("/v1/plugins/query", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(options),
    });
    if (response.status !== 200) return { error: await response.json() };
    return { result: await response.json() };
  },

  // Store
  async getStorePage() {
    const response = await apiFetch("/v1/plugins/store", {
      credentials: "include",
    });
    if (response.status !== 200) return { error: await response.json() };
    return { result: await response.json() };
  },

  async getHotPlugins(options: PluginRecommendationRequest) {
    const response = await apiFetch("/v1/plugins/store/hot", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(options),
    });
    if (response.status !== 200) return { error: await response.json() };
    return { result: await response.json() };
  },

  async getNewArrivalsPlugins(options: PluginRecommendationRequest) {
    const response = await apiFetch("/v1/plugins/store/new", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(options),
    });
    if (response.status !== 200) return { error: await response.json() };
    return { result: await response.json() };
  },

  async getStaffPicksPlugins(options: PluginRecommendationRequest) {
    const response = await apiFetch("/v1/plugins/store/staff", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(options),
    });
    if (response.status !== 200) return { error: await response.json() };
    return { result: await response.json() };
  },

  async getRecommendedForYouPlugins(options: PluginRecommendationRequest) {
    const response = await apiFetch("/v1/plugins/store/recommend", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(options),
    });
    if (response.status !== 200) return { error: await response.json() };
    return { result: await response.json() };
  },

  async getPluginDetails(pluginId: Guid) {
    const response = await apiFetch(`/v1/plugins/store/${encodeId(pluginId)}`, {
      credentials: "include",
    });
    if (response.status !== 200) return { error: await response.json() };
    return { result: await response.json() };
  },

  async getPluginVersions(pluginId: Guid) {
    const response = await apiFetch(
      `/v1/plugins/store/${encodeId(pluginId)}/versions`,
      {
        credentials: "include",
      }
    );
    if (response.status !== 200) return { error: await response.json() };
    var result = (await response.json()) as PluginVersion[];
    return {
      result: result.map((x) => ({
        ...x,
        parsedConfig: x.config && JSON.parse(x.config),
      })),
    };
  },

  async getPluginVersionDetails(pluginId: Guid, versionId: Guid) {
    const response = await apiFetch(
      `/v1/plugins/store/${encodeId(pluginId)}/versions/${encodeId(versionId)}`,
      {
        credentials: "include",
      }
    );
    if (response.status !== 200) return { error: await response.json() };

    var result = (await response.json()) as PluginVersion;
    if (result.config) result.parsedConfig = JSON.parse(result.config);
    return {
      result: result,
    };
  },

  async reportPlugin(pluginId: Guid, report: PluginReportRequest) {
    const response = await apiFetch(
      `/v1/plugins/store/${encodeId(pluginId)}/report`,
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(report),
      }
    );
    if (response.status !== 200) return { error: await response.json() };
    return { result: undefined };
  },

  // Reviews
  async listPluginReviews(pluginId: Guid, limit = 10, offset = 0) {
    const response = await apiFetch(
      `/v1/plugins/store/${encodeId(
        pluginId
      )}/reviews?limit=${limit}&offset=${offset}`,
      {
        credentials: "include",
      }
    );
    if (response.status !== 200) return { error: await response.json() };
    return { result: await response.json() };
  },

  async addOrEditPluginReview(pluginId: Guid, review: ReviewRequest) {
    const response = await apiFetch(
      `/v1/plugins/store/${encodeId(pluginId)}/reviews`,
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(review),
      }
    );
    if (response.status !== 200) return { error: await response.json() };
    return { result: await response.json() };
  },

  async removePluginReview(pluginId: Guid) {
    const response = await apiFetch(
      `/v1/plugins/store/${encodeId(pluginId)}/reviews`,
      {
        method: "DELETE",
        credentials: "include",
      }
    );
    if (response.status !== 200) return { error: await response.json() };
    return { result: undefined };
  },

  async reportPluginReview(
    pluginId: Guid,
    reviewId: Guid,
    report: PluginReviewReportRequest
  ) {
    const response = await apiFetch(
      `/v1/plugins/store/${encodeId(pluginId)}/reviews/${encodeId(reviewId)}`,
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(report),
      }
    );
    if (response.status !== 200) return { error: await response.json() };
    return { result: undefined };
  },

  // Plugin Management
  async createPlugin(data: CreatePluginRequest) {
    const formData = new FormData();
    formData.append("Title", data.title);
    if (data.description) formData.append("Description", data.description);
    formData.append("PaymentType", data.paymentType.toString());
    if (data.price) formData.append("Price", data.price.toString());
    formData.append("PlatformType", data.platforms.toString());
    formData.append("Icon", data.icon);

    const response = await apiFetch("/v1/plugins/manage/create", {
      method: "POST",
      credentials: "include",
      body: formData,
    });
    if (response.status !== 200) return { error: await response.json() };
    return { result: await response.json() };
  },

  async editPlugin(pluginId: Guid, data: Partial<CreatePluginRequest>) {
    const formData = new FormData();
    if (data.title) formData.append("Title", data.title);
    if (data.description) formData.append("Description", data.description);
    if (data.paymentType !== undefined)
      formData.append("PaymentType", data.paymentType.toString());
    if (data.price) formData.append("Price", data.price.toString());
    if (data.platforms !== undefined)
      formData.append("PlatformType", data.platforms.toString());
    if (data.icon) formData.append("Icon", data.icon);

    const response = await apiFetch(
      `/v1/plugins/manage/${encodeId(pluginId)}`,
      {
        method: "PATCH",
        credentials: "include",
        body: formData,
      }
    );
    if (response.status !== 200) return { error: await response.json() };
    return { result: undefined };
  },

  async deletePlugin(pluginId: Guid) {
    const response = await apiFetch(
      `/v1/plugins/manage/${encodeId(pluginId)}`,
      {
        method: "DELETE",
        credentials: "include",
      }
    );
    if (response.status !== 200) return { error: await response.json() };
    return { result: undefined };
  },

  // Assets
  async getPluginAssets(pluginId: Guid, limit = 10, offset = 0) {
    const response = await apiFetch(
      `/v1/plugins/manage/assets/${encodeId(
        pluginId
      )}?limit=${limit}&offset=${offset}`,
      {
        credentials: "include",
      }
    );
    if (response.status !== 200) return { error: await response.json() };
    return { result: await response.json() };
  },

  async cachePluginAssets(pluginId: Guid, limit = 50, offset = 0) {
    const response = await apiFetch(
      `/v1/plugins/manage/assets/${encodeId(
        pluginId
      )}/cache?limit=${limit}&offset=${offset}`,
      {
        credentials: "include",
      }
    );
    if (response.status !== 200) return { error: await response.json() };
    return { result: await response.json() };
  },

  async uploadPluginAssets(pluginId: Guid, files: File[], keys: string[]) {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`file${index}`, file);
      formData.append(`keys[${index}]`, keys[index]);
    });

    const response = await apiFetch(
      `/v1/plugins/manage/assets/${encodeId(pluginId)}`,
      {
        method: "POST",
        credentials: "include",
        body: formData,
      }
    );
    if (response.status !== 200) return { error: await response.json() };
    return { result: await response.json() };
  },

  async editPluginAsset(
    pluginId: Guid,
    assetId: Guid,
    file?: File,
    assetKey?: string
  ) {
    const formData = new FormData();
    if (file) formData.append("File", file);
    if (assetKey) formData.append("assetKey", assetKey);

    const response = await apiFetch(
      `/v1/plugins/manage/assets/${encodeId(pluginId)}/${encodeId(assetId)}`,
      {
        method: "PATCH",
        credentials: "include",
        body: formData,
      }
    );
    if (response.status !== 200) return { error: await response.json() };
    return { result: undefined };
  },
  async setPluginAssetAsStoreAsset(
    pluginId: Guid,
    assetId: Guid,
    position: number = 0
  ) {
    const response = await apiFetch(
      `/v1/plugins/manage/assets/${encodeId(pluginId)}/${encodeId(
        assetId
      )}/store?position=${position}`,
      {
        method: "GET", // Using GET as per the C# route mapping
        credentials: "include",
      }
    );
    if (response.status !== 200) return { error: await response.json() };
    return { result: undefined };
  },

  async editPluginAssetAsStoreAsset(
    pluginId: Guid,
    assetId: Guid,
    position: number = 0
  ) {
    const response = await apiFetch(
      `/v1/plugins/manage/assets/${encodeId(pluginId)}/${encodeId(
        assetId
      )}/store?position=${position}`,
      {
        method: "PATCH",
        credentials: "include",
      }
    );
    if (response.status !== 200) return { error: await response.json() };
    return { result: undefined };
  },

  async removePluginAssetAsStoreAsset(pluginId: Guid, assetId: Guid) {
    const response = await apiFetch(
      `/v1/plugins/manage/assets/${encodeId(pluginId)}/${encodeId(
        assetId
      )}/store`,
      {
        method: "DELETE",
        credentials: "include",
      }
    );
    if (response.status !== 200) return { error: await response.json() };
    return { result: undefined };
  },

  async removePluginAssets(pluginId: Guid, assetIds: Guid[]) {
    const response = await apiFetch(
      `/v1/plugins/manage/assets/${encodeId(pluginId)}`,
      {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assetIds),
      }
    );
    if (response.status !== 200) return { error: await response.json() };
    return { result: undefined };
  },

  // Localizations
  async getPluginLocalizations(pluginId: Guid) {
    const response = await apiFetch(
      `/v1/plugins/manage/localizations/${encodeId(pluginId)}`,
      {
        credentials: "include",
      }
    );
    if (response.status !== 200) return { error: await response.json() };
    return { result: await response.json() };
  },

  async addPluginLocalization(
    pluginId: Guid,
    regionCode: string,
    localizedText: string
  ) {
    const response = await apiFetch(
      `/v1/plugins/manage/localizations/${encodeId(pluginId)}`,
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          regionCode,
          localizedText,
        }),
      }
    );
    if (response.status !== 200) return { error: await response.json() };
    return { result: await response.json() };
  },

  async editPluginLocalization(
    pluginId: Guid,
    localizationId: Guid,
    data: EditLocalizationDataRequest
  ) {
    const response = await apiFetch(
      `/v1/plugins/manage/localizations/${encodeId(pluginId)}/${encodeId(
        localizationId
      )}`,
      {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }
    );
    if (response.status !== 200) return { error: await response.json() };
    return { result: await response.json() };
  },

  async removePluginLocalizations(pluginId: Guid, localizationIds: Guid[]) {
    const response = await apiFetch(
      `/v1/plugins/manage/localizations/${encodeId(pluginId)}`,
      {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(localizationIds),
      }
    );
    if (response.status !== 200) return { error: await response.json() };
    return { result: undefined };
  },

  // Plugin DB
  async getPluginDbKeyDetails(pluginId: Guid, dataKey: string) {
    const encodedKey = btoa(dataKey);
    const response = await apiFetch(
      `/v1/plugins/manage/${encodeId(pluginId)}/storage/${encodedKey}`,
      {
        credentials: "include",
      }
    );
    if (response.status !== 200) return { error: await response.json() };
    return { result: await response.json() };
  },

  async getPluginDbKeyValue(pluginId: Guid, dataKey: string) {
    const encodedKey = btoa(dataKey);
    const response = await apiFetch(
      `/v1/plugins/manage/${encodeId(pluginId)}/storage/${encodedKey}/value`,
      {
        credentials: "include",
      }
    );
    if (response.status !== 200) return { error: await response.json() };
    return { result: await response.json() };
  },

  async addPluginDbKeyDetails(
    pluginId: Guid,
    dataKey: string,
    data: AddPluginDbKeyRequest
  ) {
    const encodedKey = btoa(dataKey);
    const response = await apiFetch(
      `/v1/plugins/manage/${encodeId(pluginId)}/storage/${encodedKey}`,
      {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }
    );
    if (response.status !== 200) return { error: await response.json() };
    return { result: undefined };
  },

  async deletePluginDbKey(pluginId: Guid, dataKey: string) {
    const encodedKey = btoa(dataKey);
    const response = await apiFetch(
      `/v1/plugins/manage/${encodeId(pluginId)}/storage/${encodedKey}`,
      {
        method: "DELETE",
        credentials: "include",
      }
    );
    if (response.status !== 200) return { error: await response.json() };
    return { result: undefined };
  },

  async listPluginDbKeys(pluginId: Guid, limit = 10, offset = 0) {
    const response = await apiFetch(
      `/v1/plugins/manage/${encodeId(
        pluginId
      )}/storage?limit=${limit}&offset=${offset}`,
      {
        credentials: "include",
      }
    );
    if (response.status !== 200) return { error: await response.json() };
    return { result: await response.json() };
  },

  async getPluginStorageLimits(pluginId: Guid) {
    const response = await apiFetch(
      `/v1/plugins/manage/${encodeId(pluginId)}/storage/limits`,
      {
        credentials: "include",
      }
    );
    if (response.status !== 200) return { error: await response.json() };
    return { result: await response.json() };
  },

  // User DB
  async getPluginUserDbKeyDetails(pluginId: Guid, dataKey: string) {
    const encodedKey = btoa(dataKey);
    const response = await apiFetch(
      `/v1/plugins/manage/${encodeId(pluginId)}/user/storage/${encodedKey}`,
      {
        credentials: "include",
      }
    );
    if (response.status !== 200) return { error: await response.json() };
    return { result: await response.json() };
  },

  async getPluginUserDbKeyValue(pluginId: Guid, dataKey: string) {
    const encodedKey = btoa(dataKey);
    const response = await apiFetch(
      `/v1/plugins/manage/${encodeId(
        pluginId
      )}/user/storage/${encodedKey}/value`,
      {
        credentials: "include",
      }
    );
    if (response.status !== 200) return { error: await response.json() };
    return { result: await response.json() };
  },

  async addPluginUserDbKeyDetails(
    pluginId: Guid,
    dataKey: string,
    data: AddPluginDbKeyRequest
  ) {
    const encodedKey = btoa(dataKey);
    const response = await apiFetch(
      `/v1/plugins/manage/${encodeId(pluginId)}/user/storage/${encodedKey}`,
      {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }
    );
    if (response.status !== 200) return { error: await response.json() };
    return { result: undefined };
  },

  async deletePluginUserDbKey(pluginId: Guid, dataKey: string) {
    const encodedKey = btoa(dataKey);
    const response = await apiFetch(
      `/v1/plugins/manage/${encodeId(pluginId)}/user/storage/${encodedKey}`,
      {
        method: "DELETE",
        credentials: "include",
      }
    );
    if (response.status !== 200) return { error: await response.json() };
    return { result: undefined };
  },

  async deletePluginUserAllDbKeys(pluginId: Guid) {
    const response = await apiFetch(
      `/v1/plugins/manage/${encodeId(pluginId)}/user/storage`,
      {
        method: "DELETE",
        credentials: "include",
      }
    );
    if (response.status !== 200) return { error: await response.json() };
    return { result: undefined };
  },

  async getPluginUserStorageLimits(pluginId: Guid) {
    const response = await apiFetch(
      `/v1/plugins/manage/${encodeId(pluginId)}/user/storage`,
      {
        credentials: "include",
      }
    );
    if (response.status !== 200) return { error: await response.json() };
    return { result: await response.json() };
  },

  // Versions
  async createPluginVersion(pluginId: Guid, data: CreatePluginVersionRequest) {
    const formData = new FormData();
    if (data.config) formData.append("config", data.config);
    if (data.module) formData.append("module", data.module);
    formData.append("versionString", data.versionString);
    formData.append("systemApiVersion", data.systemApiVersion);
    if (data.releaseNotes) formData.append("releaseNotes", data.releaseNotes);
    if (data.isActive !== undefined)
      formData.append("isActive", data.isActive.toString());
    if (data.isBeta !== undefined)
      formData.append("isBeta", data.isBeta.toString());

    const response = await apiFetch(
      `/v1/plugins/manage/${encodeId(pluginId)}/version`,
      {
        method: "POST",
        credentials: "include",
        body: formData,
      }
    );
    if (response.status !== 200) return { error: await response.json() };
    return { result: await response.json() };
  },

  async editPluginVersion(
    pluginId: Guid,
    versionId: Guid,
    data: Partial<CreatePluginVersionRequest>
  ) {
    const formData = new FormData();
    if (data.config) formData.append("config", data.config);
    if (data.module) formData.append("module", data.module);
    if (data.releaseNotes) formData.append("releaseNotes", data.releaseNotes);
    if (data.isActive !== undefined)
      formData.append("isActive", data.isActive.toString());
    if (data.isBeta !== undefined)
      formData.append("isBeta", data.isBeta.toString());

    const response = await apiFetch(
      `/v1/plugins/manage/${encodeId(pluginId)}/version/${encodeId(versionId)}`,
      {
        method: "POST",
        credentials: "include",
        body: formData,
      }
    );
    if (response.status !== 200) return { error: await response.json() };
    return { result: await response.json() };
  },

  async removePluginVersion(pluginId: Guid, versionId: Guid) {
    const response = await apiFetch(
      `/v1/plugins/manage/${encodeId(pluginId)}/version/${encodeId(versionId)}`,
      {
        method: "DELETE",
        credentials: "include",
      }
    );
    if (response.status !== 200) return { error: await response.json() };
    return { result: undefined };
  },

  async publishPluginVersion(pluginId: Guid, versionId: Guid) {
    const response = await apiFetch(
      `/v1/plugins/manage/${encodeId(pluginId)}/publish/${encodeId(versionId)}`,
      {
        method: "POST",
        credentials: "include",
      }
    );
    if (response.status !== 200) return { error: await response.json() };
    return { result: undefined };
  },

  async reviewPluginVersion(
    pluginId: Guid,
    versionId: Guid,
    data: ReviewPluginVersionRequest
  ) {
    const response = await apiFetch(
      `/v1/plugins/manage/${encodeId(pluginId)}/review/${encodeId(versionId)}`,
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }
    );
    if (response.status !== 200) return { error: await response.json() };
    return { result: undefined };
  },

  // Logs
  async logPluginLog(pluginId: Guid, logData: any) {
    const response = await apiFetch(`/v1/plugins/logs/${encodeId(pluginId)}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(logData),
    });
    if (response.status !== 200) return { error: await response.json() };
    return { result: undefined };
  },

  async queryPluginLogs(pluginId: Guid) {
    const response = await apiFetch(`/v1/plugins/logs/${encodeId(pluginId)}`, {
      credentials: "include",
    });
    if (response.status !== 200) return { error: await response.json() };
    return { result: await response.json() };
  },
};
