using Amazon.S3.Model;
using Google.Protobuf.Compiler;
using Microsoft.AspNetCore.Server.HttpSys;
using Microsoft.Extensions.Primitives;
using NpgsqlTypes;
using OpenTelemetry;
using Org.BouncyCastle.Asn1.Ocsp;
using Org.BouncyCastle.Utilities.Encoders;
using Socigy.Connectors.User.Info;
using Socigy.Microservices.Content.Services;
using Socigy.Microservices.Plugins.Enums;
using Socigy.Microservices.Plugins.Requests;
using Socigy.Microservices.Plugins.Responses;
using Socigy.Microservices.Plugins.Structures;
using Socigy.Microservices.Plugins.Structures.Queries;
using Socigy.Middlewares;
using Socigy.Middlewares.Attributes;
using Socigy.Services.Communication;
using Socigy.Services.Database;
using Socigy.Structures;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization.Metadata;
using System.Text.RegularExpressions;
using static Socigy.Microservices.Plugins.PluginConstants;
using static Socigy.Microservices.Plugins.SQLCommands;

namespace Socigy.Microservices.Plugins.Controllers.Store
{
    [Auth]
    public class PluginStoreController : BaseApiController
    {
        private readonly IDatabaseService _Db;
        private readonly IStorageService _Storage;

        private readonly UserInfoGrpcService.UserInfoGrpcServiceClient _User;
        public PluginStoreController(IJsonTypeInfoResolver jsonTypeInfoResolver, IDatabaseService db, IStorageService storage, UserInfoGrpcService.UserInfoGrpcServiceClient user) : base(jsonTypeInfoResolver)
        {
            _Db = db;
            _Storage = storage;
            _User = user;
        }

        #region Querying
        private IAsyncEnumerable<PluginRecommendation> RecommendPlugin(Guid? userId, PluginRecommendationRequest request, Guid? askingUser = null)
        {
            if (request.PublishStatuses?.Any(x => x != PublishStatus.Published) == true)
            {
                if (askingUser.HasValue && request.OwnerId == askingUser.Value)
                { }
                else
                    return AsyncEnumerable.Empty<PluginRecommendation>();
            }

            string sortBy = request.SortBy ?? "installationCount";
            string sortDirection = request.SortDirection ?? "desc";

            string validatedSortBy = ValidateSortField(sortBy);
            string validatedSortDirection = sortDirection.ToLower() == "asc" ? "ASC" : "DESC";

            return _Db.GetMultipleNullable<PluginRecommendation, Guid>(SQLCommands.Store.Query, null,
                ("search", request.Search, NpgsqlDbType.Text),
                ("core_languages", request.PluginLanguages, NpgsqlDbType.Smallint | NpgsqlDbType.Array),
                ("region_codes", request.RegionCodes, NpgsqlDbType.Text | NpgsqlDbType.Array),
                ("user_id", userId, NpgsqlDbType.Uuid),
                ("owner_id", request.OwnerId, NpgsqlDbType.Uuid),
                ("category_ids", request.CategoryIds, NpgsqlDbType.Array | NpgsqlDbType.Uuid),
                ("excluded_category_ids", request.ExcludedCategoryIds, NpgsqlDbType.Array | NpgsqlDbType.Uuid),
                ("creator_ids", request.CreatorIds, NpgsqlDbType.Array | NpgsqlDbType.Uuid),
                ("excluded_creator_ids", request.ExcludedCreatorIds, NpgsqlDbType.Array | NpgsqlDbType.Uuid),
                ("posted_after", request.PostedAfter, NpgsqlDbType.Timestamp),
                ("posted_before", request.PostedBefore, NpgsqlDbType.Timestamp),
                ("min_verification_status", request.MinVerificationStatuses?.Select(x => (short)x).ToArray(), NpgsqlDbType.Smallint | NpgsqlDbType.Array),
                ("min_age_rating", request.MinAgeRating, NpgsqlDbType.Smallint),
                ("max_age_rating", request.MaxAgeRating, NpgsqlDbType.Smallint),
                ("payment_type", request.PaymentType, NpgsqlDbType.Smallint),
                ("platforms", request.Platforms, NpgsqlDbType.Smallint),
                ("active_only", request.ActiveOnly, NpgsqlDbType.Boolean),
                ("publish_statuses", request.PublishStatuses?.Select(x => (short)x).ToArray(), NpgsqlDbType.Smallint | NpgsqlDbType.Array),
                ("sort_by", validatedSortBy, NpgsqlDbType.Text),
                ("sort_direction", validatedSortDirection, NpgsqlDbType.Text),
                ("limit", request.Limit, NpgsqlDbType.Integer),
                ("offset", request.Offset, NpgsqlDbType.Integer));
        }

        private string ValidateSortField(string sortBy)
        {
            var allowedSortFields = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                "title",
                "createdAt",
                "averageRating",
                "installationCount",
                "price"
            };

            var fieldMapping = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                { "title", "p.title" },
                { "createdAt", "p.created_at" },
                { "averageRating", "avg_rating" },
                { "installationCount", "installation_count" },
                { "price", "p.price" }
            };

            if (!allowedSortFields.Contains(sortBy))
                return "installation_count";

            return fieldMapping[sortBy];
        }

        public async Task<IResult> QueryPlugins(HttpContext context)
        {
            var currentUser = AuthMiddleware.GetCurrentUser(context);
            var uuid = Guid.Parse(currentUser!.UserId);

            var request = await RequestAsync<PluginRecommendationRequest>(context);
            if (request.Error != null || request.Result == null)
                return request.Error!;

            var result = RecommendPlugin(null, request.Result, uuid);
            return Response(result.ToBlockingEnumerable());
        }
        #endregion

        #region Store
        private IAsyncEnumerable<PluginRecommendation> GetNewArrivals(Guid? userId, PluginRecommendationRequest request)
        {
            request.PostedAfter = DateTime.SpecifyKind(DateTime.UtcNow.AddDays(-30), DateTimeKind.Unspecified);

            return RecommendPlugin(userId, request);
        }
        private IAsyncEnumerable<PluginRecommendation> GetStaffPicks(PluginRecommendationRequest request)
        {
            if (request.PublishStatuses?.Any(x => x != PublishStatus.Published) == true)
                return AsyncEnumerable.Empty<PluginRecommendation>();

            var now = DateTime.UtcNow;
            now = DateTime.SpecifyKind(now, DateTimeKind.Unspecified);
            return _Db.GetMultipleNullable<PluginRecommendation, Guid>(SQLCommands.Store.GetStaffPicks, null,
                ("region_codes", request.RegionCodes, NpgsqlDbType.Text | NpgsqlDbType.Array),
                ("min_verification_status", request.MinVerificationStatuses?.Select(x => (short)x).ToArray(), NpgsqlDbType.Smallint | NpgsqlDbType.Array),
                ("publish_status", request.PublishStatuses?.Select(x => (short)x).ToArray(), NpgsqlDbType.Smallint | NpgsqlDbType.Array),
                ("current_date", now, NpgsqlDbType.Timestamp),
                ("platforms", request.Platforms, NpgsqlDbType.Smallint),
                ("limit", request.Limit, NpgsqlDbType.Integer),
                ("offset", request.Offset, NpgsqlDbType.Integer));
        }
        public async Task<IResult> GetPluginStorePageDetails(HttpContext context)
        {
            var currentUser = AuthMiddleware.GetCurrentUser(context);
            var uuid = Guid.Parse(currentUser!.UserId);

            var defaultRequest = new PluginRecommendationRequest();
            var pageResponse = new PluginStorePageResponse()
            {
                Hot = RecommendPlugin(null, defaultRequest, uuid).ToBlockingEnumerable(),
                NewArrivals = GetNewArrivals(null, defaultRequest).ToBlockingEnumerable(),
                StaffPicks = GetStaffPicks(defaultRequest).ToBlockingEnumerable(),
                RecommendedForYou = RecommendPlugin(uuid, defaultRequest, uuid).ToBlockingEnumerable(),
            };

            return Response(pageResponse);
        }

        public async Task<IResult> GetHotPlugins(HttpContext context)
        {
            var currentUser = AuthMiddleware.GetCurrentUser(context);
            var uuid = Guid.Parse(currentUser!.UserId);

            var request = await RequestAsync<PluginRecommendationRequest>(context);
            if (request.Error != null || request.Result == null)
                return request.Error!;

            return Response(RecommendPlugin(null, request.Result).ToBlockingEnumerable());
        }
        public async Task<IResult> GetNewArrivalsPlugins(HttpContext context)
        {
            var currentUser = AuthMiddleware.GetCurrentUser(context);
            var uuid = Guid.Parse(currentUser!.UserId);

            var request = await RequestAsync<PluginRecommendationRequest>(context);
            if (request.Error != null || request.Result == null)
                return request.Error!;

            return Response(GetNewArrivals(null, request.Result).ToBlockingEnumerable());
        }
        public async Task<IResult> GetRecommendedForYouPlugins(HttpContext context)
        {
            var currentUser = AuthMiddleware.GetCurrentUser(context);
            var uuid = Guid.Parse(currentUser!.UserId);

            var request = await RequestAsync<PluginRecommendationRequest>(context);
            if (request.Error != null || request.Result == null)
                return request.Error!;

            return Response(RecommendPlugin(uuid, request.Result).ToBlockingEnumerable());
        }
        public async Task<IResult> GetStaffPicksPlugins(HttpContext context)
        {
            var currentUser = AuthMiddleware.GetCurrentUser(context);
            var uuid = Guid.Parse(currentUser!.UserId);

            var request = await RequestAsync<PluginRecommendationRequest>(context);
            if (request.Error != null || request.Result == null)
                return request.Error!;

            return Response(GetStaffPicks(request.Result).ToBlockingEnumerable());
        }

        public async Task<IResult> ReportPlugin(HttpContext context, string pluginId)
        {
            var currentUser = AuthMiddleware.GetCurrentUser(context);
            var uuid = Guid.Parse(currentUser!.UserId);

            var decodedPluginId = DecodeIdParameter(pluginId);
            if (decodedPluginId == null)
                return Results.BadRequest("Invalid plugin ID");

            var reportRequest = await GetFromBodyAsync<PluginReport>(context);
            if (reportRequest == null)
                return Results.BadRequest("Invalid review data");

            var plugin = await _Db.GetByIdAsync<Plugin, Guid>(decodedPluginId.Value);
            if (plugin.Value == null)
                return Results.NotFound("Plugin not found");

            var existingReport = await _Db.GetWhenNullable<PluginReport, Guid>("user_id = @user_id AND plugin_id = @plugin_id AND (@version_id IS NULL OR version_id = @version_id", null,
                ("user_id", uuid, NpgsqlDbType.Uuid),
                ("version_id", reportRequest.VersionId, NpgsqlDbType.Uuid),
                ("plugin_id", plugin.Value.ID, NpgsqlDbType.Uuid));

            // Insert
            if (existingReport == null)
            {
                var report = await new PluginReport()
                {
                    ReasonText = reportRequest.ReasonText,
                    ReasonType = reportRequest.ReasonType,
                    PluginId = plugin.Value.ID,
                    VersionId = reportRequest.PluginId,
                    UserId = uuid
                }.TryInsertAsync<PluginReport, Guid>(_Db);
                if (report == null)
                    return Unexpected();
            }
            // Update
            else
            {
                existingReport.ReasonText = reportRequest.ReasonText;
                existingReport.ReasonType = reportRequest.ReasonType;
                existingReport.UpdatedAt = DateTime.UtcNow;

                await existingReport.UpdateAsync<PluginReport, Guid>(_Db, null,
                    nameof(PluginReviewReport.ReasonText),
                    nameof(PluginReviewReport.UpdatedAt),
                    nameof(PluginReviewReport.ReasonType));
            }

            return Results.Ok();
        }

        #region Details
        public async Task<IResult> GetPluginDetails(HttpContext context, string pluginId)
        {
            var currentUser = AuthMiddleware.GetCurrentUser(context);
            var uuid = Guid.Parse(currentUser!.UserId);

            var decodedPluginId = DecodeIdParameter(pluginId);
            if (decodedPluginId == null)
                return BadRequest();

            var result = _Db.GetMultipleNullable<PluginRecommendation, Guid>(SQLCommands.Store.GetPluginDetails, null,
                ("user_id", uuid, NpgsqlDbType.Uuid),
                ("plugin_id", decodedPluginId, NpgsqlDbType.Uuid));

            var details = result.ToBlockingEnumerable().FirstOrDefault();

            var userDetails = await _User.GetUserInfoByIdInternalAsync(new UserInfoRequest() { TargetUserId = details.OwnerId.ToString() });
            details.DeveloperEmail = userDetails.Email;
            details.DeveloperUsername = userDetails.Username;
            details.DeveloperIconUrl = userDetails.IconUrl;
            details.DeveloperTag = (short)userDetails.Tag;

            return Response(details);
        }

        public async Task<IResult> GetPluginVersions(HttpContext context, string pluginId)
        {
            var currentUser = AuthMiddleware.GetCurrentUser(context);
            var uuid = Guid.Parse(currentUser!.UserId);

            var decodedPluginId = DecodeIdParameter(pluginId);
            if (!decodedPluginId.HasValue)
                return BadRequest();

            var result = _Db.GetMultipleWhen<PluginVersion, Guid>("plugin_id = @plugin_id", null,
                ("plugin_id", decodedPluginId));

            return Response(result.ToBlockingEnumerable());
        }
        public async Task<IResult> GetPluginVersionDetails(HttpContext context, string pluginId, string versionId)
        {
            var currentUser = AuthMiddleware.GetCurrentUser(context);
            var uuid = Guid.Parse(currentUser!.UserId);

            var decodedPluginId = DecodeIdParameter(pluginId);
            if (!decodedPluginId.HasValue)
                return BadRequest();

            var decodedVersionGuid = DecodeIdParameter(versionId);
            if (!decodedVersionGuid.HasValue)
                return BadRequest();

            var result = (await _Db.GetByIdAsync<PluginVersion, Guid>(decodedVersionGuid.Value)).Value;
            if (result == null || result.PluginId != decodedPluginId.Value)
                return Results.NotFound();

            return Response(result);
        }
        #endregion
        #endregion

        #region Reviews
        public async Task<IResult> ListPluginReviews(HttpContext context, string pluginId, int limit = 10, int offset = 0)
        {
            var currentUser = AuthMiddleware.GetCurrentUser(context);
            var uuid = Guid.Parse(currentUser!.UserId);

            var decodedPluginId = DecodeIdParameter(pluginId);
            if (decodedPluginId == null)
                return Results.BadRequest("Invalid plugin ID");

            var result = _Db.GetMultiple<PluginReviewResponse, Guid>(@"SELECT pr.* FROM plugin_reviews pr
    JOIN plugins p ON pr.plugin_id = p.plugin_id
    WHERE pr.plugin_id = @plugin_id 
    AND p.publish_status = @publish_status
    LIMIT @limit OFFSET @offset", null,
                ("limit", limit),
                ("offset", offset),
                ("plugin_id", decodedPluginId),
                ("publish_status", (short)PublishStatus.Published));

            var reviews = result.ToBlockingEnumerable();
            var request = new UserCircleVerificationRequest();
            request.Ids.AddRange(reviews.Select(x => x.UserId.ToString()));
            var users = _User.GetUserInfoBatchInternal(request);
            var userDictionary = new Dictionary<Guid, UserDetails>();
            while (await users.ResponseStream.MoveNext(CancellationToken.None))
            {
                var current = users.ResponseStream.Current;
                userDictionary[Guid.Parse(current.Id)] = current;
            }

            return Response(reviews.Select(x =>
            {
                var current = userDictionary[x.UserId];
                x.Username = current.Username;
                x.Tag = (short)current.Tag;
                x.IconUrl = current.IconUrl;
                return x;
            }));
        }
        public async Task<IResult> AddOrEditPluginReview(HttpContext context, string pluginId)
        {
            var currentUser = AuthMiddleware.GetCurrentUser(context);
            var uuid = Guid.Parse(currentUser!.UserId);

            var decodedPluginId = DecodeIdParameter(pluginId);
            if (decodedPluginId == null)
                return Results.BadRequest("Invalid plugin ID");

            var reviewData = await GetFromBodyAsync<ReviewRequest>(context);
            if (reviewData == null)
                return Results.BadRequest("Invalid review data");

            if (reviewData.Rating < 1 || reviewData.Rating > 5)
                return Results.BadRequest("Rating must be between 1 and 5");

            var plugin = await _Db.GetByIdAsync<Plugin, Guid>(decodedPluginId.Value);
            if (plugin.Value == null)
                return Results.NotFound("Plugin not found");

            var existingReview = await _Db.GetWhen<PluginReview, Guid>(
                "plugin_id = @pluginId AND user_id = @userId",
                null,
                ("pluginId", decodedPluginId.Value),
                ("userId", uuid)
            );

            // Update
            if (existingReview != null)
            {
                existingReview.Rating = reviewData.Rating;
                existingReview.ReviewText = reviewData.ReviewText;
                existingReview.UpdatedAt = DateTime.UtcNow;

                await _Db.UpdateAsync<PluginReview, Guid>(
                    existingReview,
                    null,
                    nameof(PluginReview.Rating),
                    nameof(PluginReview.ReviewText),
                    nameof(PluginReview.UpdatedAt)
                );

                return Response(existingReview);
            }
            // Insert
            else
            {
                var newReview = new PluginReview
                {
                    PluginId = decodedPluginId.Value,
                    UserId = uuid,
                    Rating = reviewData.Rating,
                    ReviewText = reviewData.ReviewText,
                };

                await _Db.InsertAsync<PluginReview, Guid>(newReview);
                return Response(newReview);
            }
        }

        public async Task<IResult> ReportPluginReview(HttpContext context, string pluginId, string reviewId)
        {
            var currentUser = AuthMiddleware.GetCurrentUser(context);
            var uuid = Guid.Parse(currentUser!.UserId);

            var decodedPluginId = DecodeIdParameter(pluginId);
            if (decodedPluginId == null)
                return Results.BadRequest("Invalid plugin ID");

            var reportRequest = await GetFromBodyAsync<PluginReviewReportRequest>(context);
            if (reportRequest == null)
                return Results.BadRequest("Invalid review data");

            var plugin = await _Db.GetByIdAsync<Plugin, Guid>(decodedPluginId.Value);
            if (plugin.Value == null)
                return Results.NotFound("Plugin not found");

            var review = (await _Db.GetByIdAsync<PluginReview, Guid>(decodedPluginId.Value)).Value;
            if (review == null || review.PluginId != plugin.Value.ID)
                return Results.NotFound();

            var existingReport = await _Db.GetWhen<PluginReviewReport, Guid>("user_id = @user_id AND review_id = @review_id", null,
                ("user_id", uuid),
                ("review_id", review.ID));

            // Insert
            if (existingReport == null)
            {
                var report = await new PluginReviewReport()
                {
                    ReasonText = reportRequest.ReasonText,
                    ReasonType = reportRequest.ReasonType,
                    ReviewId = review.ID,
                    UserId = uuid
                }.TryInsertAsync<PluginReviewReport, Guid>(_Db);
                if (report == null)
                    return Unexpected();
            }
            // Update
            else
            {
                existingReport.ReasonText = reportRequest.ReasonText;
                existingReport.ReasonType = reportRequest.ReasonType;
                existingReport.UpdatedAt = DateTime.UtcNow;

                await existingReport.UpdateAsync<PluginReviewReport, Guid>(_Db, null,
                    nameof(PluginReviewReport.ReasonText),
                    nameof(PluginReviewReport.UpdatedAt),
                    nameof(PluginReviewReport.ReasonType));
            }

            return Results.Ok();
        }
        public async Task<IResult> RemovePluginReview(HttpContext context, string pluginId)
        {
            var currentUser = AuthMiddleware.GetCurrentUser(context);
            var uuid = Guid.Parse(currentUser!.UserId);

            var decodedPluginId = DecodeIdParameter(pluginId);
            if (decodedPluginId == null)
                return Results.BadRequest("Invalid plugin ID");

            var reviewData = await GetFromBodyAsync<ReviewRequest>(context);
            if (reviewData == null)
                return Results.BadRequest("Invalid review data");

            if (reviewData.Rating < 1 || reviewData.Rating > 5)
                return Results.BadRequest("Rating must be between 1 and 5");

            var plugin = await _Db.GetByIdAsync<Plugin, Guid>(decodedPluginId.Value);
            if (plugin.Value == null)
                return Results.NotFound("Plugin not found");

            await _Db.ExecuteNonQueryAsync($"DELETE FROM {Tables.PluginReview} WHERE plugin_id = @plugin_id AND user_id = @user_id", null,
                ("plugin_id", decodedPluginId.Value),
                ("user_id", uuid));

            return Results.Ok();
        }
        #endregion

        #region Plugin Managment 
        public async Task<IResult> CreateNewPlugin(HttpContext context)
        {
            var currentUser = AuthMiddleware.GetCurrentUser(context);
            var uuid = Guid.Parse(currentUser!.UserId);

            var request = await CreateNewPluginRequest.FromContext(context);
            if (request == null || request.Title == null || request.Platforms == null || request.PaymentType == null || request.Icon == null)
                return BadRequest();

            var pluginId = Guid.NewGuid();
            var iconUrl = await _Storage.UploadPluginIcon(pluginId, request.Icon);
            if (iconUrl == null)
                return Unexpected();

            var plugin = await new Plugin()
            {
                ID = pluginId,
                Title = request.Title,
                Description = request.Description,
                IconUrl = iconUrl,
                PaymentType = request.PaymentType.Value,
                Price = request.Price,
                Platforms = request.Platforms.Value,
                OwnerId = uuid,

                VerificationStatus = VerificationStatus.Unverified,
                CoreLanguage = PluginCoreLanguage.Rust,
                PublishStatus = PublishStatus.Preparing,
                IsActive = true,
            }.TryInsertAsync<Plugin, Guid>(_Db, false);
            if (plugin == null)
                return Unexpected();

            return Response(plugin);
        }
        public async Task<IResult> EditPlugin(HttpContext context, string pluginId)
        {
            var currentUser = AuthMiddleware.GetCurrentUser(context);
            var uuid = Guid.Parse(currentUser!.UserId);

            var request = await CreateNewPluginRequest.FromContext(context);
            if (request == null)
                return BadRequest();

            var pluginGuid = DecodeIdParameter(pluginId);
            if (!pluginGuid.HasValue)
                return BadRequest();

            var foundPlugin = (await _Db.GetByIdAsync<Plugin, Guid>(pluginGuid.Value)).Value;
            if (foundPlugin == null)
                return Results.NotFound();
            else if (foundPlugin.OwnerId != uuid)
                return Results.Unauthorized();

            List<string> changes = [];
            if (request.Icon != null)
            {
                var iconUrl = await _Storage.UploadPluginIcon(pluginGuid.Value, request.Icon);
                if (iconUrl == null)
                    return Unexpected();

                foundPlugin.IconUrl = iconUrl;
                changes.Add(nameof(Plugin.IconUrl));
            }

            if (request.Title != null)
            {
                foundPlugin.Title = request.Title;
                changes.Add(nameof(Plugin.Title));
            }
            if (request.Description != null)
            {
                foundPlugin.Description = request.Description;
                changes.Add(nameof(Plugin.Description));
            }
            if (request.PaymentType.HasValue)
            {
                if (request.PaymentType == PaymentType.Free)
                {
                    foundPlugin.Price = null;
                    changes.Add(nameof(Plugin.Price));
                }
                else if (request.PaymentType == PaymentType.OneTime)
                {
                    if (!request.Price.HasValue || request.Price <= 0)
                        return BadRequest();

                    foundPlugin.Price = request.Price;
                    changes.Add(nameof(Plugin.Price));
                }

                foundPlugin.PaymentType = request.PaymentType.Value;
                changes.Add(nameof(Plugin.PaymentType));
            }
            if (request.Platforms.HasValue)
            {
                foundPlugin.Platforms = request.Platforms.Value;
                changes.Add(nameof(Plugin.Platforms));
            }

            if (changes.Any())
                await foundPlugin.UpdateAsync<Plugin, Guid>(_Db, null, [.. changes]);

            return Results.Ok();
        }
        public async Task<IResult> DeletePlugin(HttpContext context, string pluginId)
        {
            var currentUser = AuthMiddleware.GetCurrentUser(context);
            var uuid = Guid.Parse(currentUser!.UserId);

            var pluginGuid = DecodeIdParameter(pluginId);
            if (pluginGuid == null)
                return BadRequest();

            var foundPlugin = (await _Db.GetByIdAsync<Plugin, Guid>(pluginGuid.Value)).Value;
            if (foundPlugin == null || foundPlugin.OwnerId != uuid)
                return Results.NotFound();

            // TODO: When someone has prepaid plugin, return money back
            await _Storage.RemovePlugin(foundPlugin.ID);
            await _Db.ExecuteNonQueryAsync($"DELETE FROM {Tables.Plugin} WHERE owner_id = @owner_id AND plugin_id = @plugin_id", null,
                ("owner_id", uuid),
                ("plugin_id", pluginGuid));

            await _Db.ExecuteNonQueryAsync($"DELETE FROM {Tables.PluginInstallation} WHERE plugin_id = @plugin_id", null,
                ("plugin_id", pluginGuid));

            return Results.Ok();
        }

        #region Assets
        public async Task<IResult> GetPluginAssets(HttpContext context, string pluginId, int limit = 10, int offset = 0)
        {
            var currentUser = AuthMiddleware.GetCurrentUser(context);
            var uuid = Guid.Parse(currentUser!.UserId);

            var pluginGuid = DecodeIdParameter(pluginId);
            if (!pluginGuid.HasValue)
                return BadRequest();

            var foundPlugin = (await _Db.GetByIdAsync<Plugin, Guid>(pluginGuid.Value)).Value;
            if (foundPlugin == null || foundPlugin.OwnerId != uuid)
                return Results.NotFound();

            var response = _Db.GetMultipleWhen<PluginAsset, Guid>("plugin_id = @plugin_id LIMIT @limit OFFSET @offset", null,
                ("limit", limit),
                ("offset", offset),
                ("plugin_id", pluginGuid.Value));

            return Response(response.ToBlockingEnumerable());
        }
        public async Task<IResult> CachePluginAssets(HttpContext context, string pluginId, int limit = 50, int offset = 0, CancellationToken cancellationToken = default)
        {
            var currentUser = AuthMiddleware.GetCurrentUser(context);
            var uuid = Guid.Parse(currentUser!.UserId);

            var pluginGuid = DecodeIdParameter(pluginId);
            if (pluginGuid == null)
                return BadRequest();

            var foundPluginInstallation = await _Db.GetWhen<PluginInstallation, Guid>("user_id = @user_id AND plugin_id = @plugin_id", null,
                ("plugin_id", pluginGuid.Value),
                ("user_id", uuid));
            if (foundPluginInstallation == null)
                return BadRequest();

            var response = _Db.GetMultiple<PluginAsset, Guid>(SQLCommands.Management.CachePluginAssets, null,
                ("limit", limit),
                ("offset", offset),
                ("plugin_id", pluginGuid.Value));

            return Response(response.ToBlockingEnumerable());
        }
        public async Task<IResult> UploadPluginAssets(HttpContext context, string pluginId)
        {
            var currentUser = AuthMiddleware.GetCurrentUser(context);
            var uuid = Guid.Parse(currentUser!.UserId);

            var pluginGuid = DecodeIdParameter(pluginId);
            if (pluginGuid == null)
                return BadRequest();

            var foundPlugin = (await _Db.GetByIdAsync<Plugin, Guid>(pluginGuid.Value)).Value;
            if (foundPlugin == null || foundPlugin.OwnerId != uuid)
                return BadRequest();

            var form = await context.Request.ReadFormAsync();
            var files = form.Files;

            if (files.Count == 0)
                return BadRequest("No assets were uploaded");

            var uploadedAssets = new List<PluginAsset>();
            var assetKeyRegex = Regexes.FileRegex();
            for (int i = 0; i < files.Count; i++)
            {
                var file = files[i];
                var assetKey = form[$"keys[{i}]"].ToString();
                if (string.IsNullOrEmpty(assetKey) || !assetKeyRegex.IsMatch(assetKey))
                    continue;

                var result = await _Storage.UploadPluginAsset(foundPlugin.ID, assetKey, file);
                if (!result.HasValue)
                    return Unexpected();

                var asset = await new PluginAsset()
                {
                    ID = Guid.NewGuid(),
                    PluginId = foundPlugin.ID,
                    AssetKey = assetKey,
                    AssetUrl = result.Value.Url,
                    MediaType = result.Value.Type,
                    CreatedAt = DateTime.UtcNow
                }.TryInsertAsync<PluginAsset, Guid>(_Db, false);
                if (asset == null)
                    return Unexpected();

                uploadedAssets.Add(asset);
            }

            return Response(uploadedAssets);
        }
        public async Task<IResult> RemovePluginAssets(HttpContext context, string pluginId)
        {
            var currentUser = AuthMiddleware.GetCurrentUser(context);
            var uuid = Guid.Parse(currentUser!.UserId);

            var pluginGuid = DecodeIdParameter(pluginId);
            if (pluginGuid == null)
                return BadRequest();

            var foundPlugin = (await _Db.GetByIdAsync<Plugin, Guid>(pluginGuid.Value)).Value;
            if (foundPlugin == null || foundPlugin.OwnerId != uuid)
                return BadRequest();

            var request = await GetFromBodyAsync<IEnumerable<Guid>>(context);
            if (request == null)
                return BadRequest();

            await _Storage.RemovePluginAssets(foundPlugin.ID, _Db.GetMultipleWhen<PluginAsset, Guid>("plugin_id = @plugin_id AND asset_id = ANY(@asset_ids)", null,
                ("plugin_id", foundPlugin.ID),
                ("asset_ids", request.ToArray())
            ).ToBlockingEnumerable().Select(x => Path.GetFileName(x.AssetUrl)));

            await _Db.ExecuteNonQueryAsync(Management.DeletePluginAssets, null,
                ("asset_ids", request.ToArray()),
                ("plugin_id", foundPlugin.ID));

            return Results.Ok();
        }
        public async Task<IResult> EditPluginAsset(HttpContext context, string pluginId, string assetId)
        {
            var currentUser = AuthMiddleware.GetCurrentUser(context);
            var uuid = Guid.Parse(currentUser!.UserId);

            var pluginGuid = DecodeIdParameter(pluginId);
            if (pluginGuid == null)
                return BadRequest();

            var decodedAssetKey = DecodeIdParameter(assetId);
            if (!decodedAssetKey.HasValue)
                return BadRequest();

            var foundPlugin = (await _Db.GetByIdAsync<Plugin, Guid>(pluginGuid.Value)).Value;
            if (foundPlugin == null || foundPlugin.OwnerId != uuid)
                return BadRequest();

            var foundAsset = (await _Db.GetByIdAsync<PluginAsset, Guid>(decodedAssetKey.Value)).Value;
            if (foundAsset == null)
                return BadRequest();

            var form = await context.Request.ReadFormAsync();
            if (form == null || form.Files.Count > 1)
                return BadRequest();

            var updatedFields = new List<string>();
            if (form.TryGetValue("assetKey", out StringValues assetKey))
            {
                var assetKeyValue = assetKey.ToString();
                var assetKeyRegex = Regexes.FileRegex();
                if (!assetKeyRegex.IsMatch(assetKeyValue))
                    return BadRequest();

                foundAsset.AssetKey = assetKeyValue;
                updatedFields.Add(nameof(PluginAsset.AssetKey));
            }

            var updatedFile = form.Files.FirstOrDefault();
            if (updatedFile != null)
            {
                var result = await _Storage.UploadPluginAsset(foundPlugin.ID, foundAsset.AssetKey, updatedFile);
                if (!result.HasValue)
                    return Unexpected();

                foundAsset.AssetUrl = result.Value.Url;
                foundAsset.MediaType = result.Value.Type;
                updatedFields.AddRange([nameof(PluginAsset.AssetUrl), nameof(PluginAsset.MediaType)]);
            }

            if (!updatedFields.Any())
                return BadRequest();

            await foundAsset.UpdateAsync<PluginAsset, Guid>(_Db, null, [.. updatedFields]);

            return Results.Ok();
        }
        public async Task<IResult> SetPluginAssetAsStoreAsset(HttpContext context, string pluginId, string assetId, short position = 0, CancellationToken token = default)
        {
            var currentUser = AuthMiddleware.GetCurrentUser(context);
            var uuid = Guid.Parse(currentUser!.UserId);

            var pluginGuid = DecodeIdParameter(pluginId);
            if (pluginGuid == null)
                return BadRequest();

            var decodedAssetKey = DecodeIdParameter(assetId);
            if (!decodedAssetKey.HasValue)
                return BadRequest();

            var foundPlugin = (await _Db.GetByIdAsync<Plugin, Guid>(pluginGuid.Value)).Value;
            if (foundPlugin == null || foundPlugin.OwnerId != uuid)
                return BadRequest();

            var foundAsset = (await _Db.GetByIdAsync<PluginAsset, Guid>(decodedAssetKey.Value)).Value;
            if (foundAsset == null)
                return BadRequest();

            var foundStoreAsset = (await _Db.GetByIdAsync<PluginStoreAsset, (Guid, Guid)>((foundAsset.ID, foundPlugin.ID))).Value;
            if (foundStoreAsset != null)
                return BadRequest();

            if (await _Db.GetWhen<PluginStoreAsset, (Guid, Guid)>("plugin_id = @plugin_id AND position = @position", null,
                ("plugin_id", foundPlugin.ID),
                ("position", position)) != null)
                return BadRequest();

            await new PluginStoreAsset()
            {
                ID = (foundAsset.ID, foundPlugin.ID),
                Position = position
            }.TryInsertAsync<PluginStoreAsset, (Guid, Guid)>(_Db, false);

            return Results.Ok();
        }
        public async Task<IResult> EditPluginAssetAsStoreAsset(HttpContext context, string pluginId, string assetId, short position = 0, CancellationToken token = default)
        {
            var currentUser = AuthMiddleware.GetCurrentUser(context);
            var uuid = Guid.Parse(currentUser!.UserId);

            var pluginGuid = DecodeIdParameter(pluginId);
            if (pluginGuid == null)
                return BadRequest();

            var decodedAssetKey = DecodeIdParameter(assetId);
            if (!decodedAssetKey.HasValue)
                return BadRequest();

            var foundPlugin = (await _Db.GetByIdAsync<Plugin, Guid>(pluginGuid.Value)).Value;
            if (foundPlugin == null || foundPlugin.OwnerId != uuid)
                return BadRequest();

            var foundAsset = (await _Db.GetByIdAsync<PluginAsset, Guid>(decodedAssetKey.Value)).Value;
            if (foundAsset == null)
                return BadRequest();

            var foundStoreAsset = (await _Db.GetByIdAsync<PluginStoreAsset, (Guid, Guid)>((foundAsset.ID, foundPlugin.ID))).Value;
            if (foundStoreAsset == null)
                return Results.NotFound();

            if (await _Db.GetWhen<PluginStoreAsset, (Guid, Guid)>("plugin_id = @plugin_id AND position = @position", null,
                ("plugin_id", foundPlugin.ID),
                ("position", position)) != null)
                return BadRequest();

            foundStoreAsset.Position = position;
            await foundStoreAsset.UpdateAsync<PluginStoreAsset, (Guid, Guid)>(_Db, null, nameof(PluginStoreAsset.Position));
            return Results.Ok();
        }
        public async Task<IResult> RemovePluginAssetAsStoreAsset(HttpContext context, string pluginId, string assetId)
        {
            var currentUser = AuthMiddleware.GetCurrentUser(context);
            var uuid = Guid.Parse(currentUser!.UserId);

            var pluginGuid = DecodeIdParameter(pluginId);
            if (pluginGuid == null)
                return BadRequest();

            var decodedAssetKey = DecodeIdParameter(assetId);
            if (!decodedAssetKey.HasValue)
                return BadRequest();

            var foundPlugin = (await _Db.GetByIdAsync<Plugin, Guid>(pluginGuid.Value)).Value;
            if (foundPlugin == null || foundPlugin.OwnerId != uuid)
                return BadRequest();

            var foundAsset = (await _Db.GetByIdAsync<PluginAsset, Guid>(decodedAssetKey.Value)).Value;
            if (foundAsset == null)
                return BadRequest();

            await _Db.DeleteByIdAsync<PluginStoreAsset, (Guid, Guid)>(new PluginStoreAsset() { ID = (foundAsset.ID, foundPlugin.ID) });

            return Results.Ok();
        }
        #endregion

        #region Localizations
        private static bool IsValidJSON(string input)
        {
            try
            {
                _ = JsonDocument.Parse(input);
            }
            catch
            {
                return false;
            }

            return true;
        }

        public async Task<IResult> AddPluginLocalization(HttpContext context, string pluginId)
        {
            var currentUser = AuthMiddleware.GetCurrentUser(context);
            var uuid = Guid.Parse(currentUser!.UserId);

            var pluginGuid = DecodeIdParameter(pluginId);
            if (pluginGuid == null)
                return BadRequest();

            var foundPlugin = (await _Db.GetByIdAsync<Plugin, Guid>(pluginGuid.Value)).Value;
            if (foundPlugin == null || foundPlugin.OwnerId != uuid)
                return BadRequest();

            var request = await GetFromBodyAsync<Dictionary<string, string>>(context);
            if (request == null || !request.ContainsKey("regionCode") || !request.ContainsKey("localizedText"))
                return BadRequest();

            var regionCode = request["regionCode"];
            var localizedText = request["localizedText"];
            if (!IsValidJSON(localizedText))
                return BadRequest();

            var regionCodeRegex = Regexes.RegionCodeRegex();
            if (!regionCodeRegex.IsMatch(regionCode))
                return BadRequest("Invalid region code format");

            var existingLocalization = await _Db.GetWhen<LocalizationData, Guid>("plugin_id = @plugin_id AND region_code = @region_code", null,
                ("plugin_id", foundPlugin.ID),
                ("region_code", regionCode));

            if (existingLocalization != null)
                return Results.Conflict("Localization for this region already exists");

            var localization = await new LocalizationData()
            {
                ID = Guid.NewGuid(),
                PluginId = foundPlugin.ID,
                RegionCode = regionCode,
                LocalizedText = localizedText
            }.TryInsertAsyncOverride<LocalizationData, Guid>(_Db, false, overrides: ("localized_text", NpgsqlDbType.Jsonb));

            if (localization == null)
                return Unexpected();

            return Response(localization);
        }
        public async Task<IResult> RemovePluginLocalizations(HttpContext context, string pluginId)
        {
            var currentUser = AuthMiddleware.GetCurrentUser(context);
            var uuid = Guid.Parse(currentUser!.UserId);

            var pluginGuid = DecodeIdParameter(pluginId);
            if (pluginGuid == null)
                return BadRequest();

            var foundPlugin = (await _Db.GetByIdAsync<Plugin, Guid>(pluginGuid.Value)).Value;
            if (foundPlugin == null || foundPlugin.OwnerId != uuid)
                return BadRequest();

            var request = await GetFromBodyAsync<IEnumerable<Guid>>(context);
            if (request == null)
                return BadRequest();

            await _Db.ExecuteNonQueryAsync(Management.DeletePluginLocalizations, null,
                ("plugin_id", foundPlugin.ID),
                ("localization_ids", request.ToArray()));

            return Results.Ok();
        }
        public async Task<IResult> EditPluginLocalization(HttpContext context, string pluginId, string localizationId)
        {
            var currentUser = AuthMiddleware.GetCurrentUser(context);
            var uuid = Guid.Parse(currentUser!.UserId);

            var pluginGuid = DecodeIdParameter(pluginId);
            if (pluginGuid == null)
                return BadRequest();

            var localizationGuid = DecodeIdParameter(localizationId);
            if (localizationGuid == null)
                return BadRequest();

            var foundPlugin = (await _Db.GetByIdAsync<Plugin, Guid>(pluginGuid.Value)).Value;
            if (foundPlugin == null || foundPlugin.OwnerId != uuid)
                return BadRequest();

            var foundLocalization = await _Db.GetWhen<LocalizationData, Guid>("plugin_id = @plugin_id AND localization_id = @localization_id", null,
                ("plugin_id", foundPlugin.ID),
                ("localization_id", localizationGuid));

            if (foundLocalization == null)
                return Results.NotFound();

            var request = await GetFromBodyAsync<EditLocalizationDataRequest>(context);
            if (request == null)
                return BadRequest();

            var changes = new List<string>();
            if (request.Content != null)
            {
                foundLocalization.LocalizedText = request.Content;
                changes.Add(nameof(LocalizationData.LocalizedText));
            }

            if (request.RegionCode != null)
            {
                var regionCodeRegex = Regexes.RegionCodeRegex();
                if (!regionCodeRegex.IsMatch(request.RegionCode))
                    return BadRequest("Invalid region code format");

                foundLocalization.RegionCode = request.RegionCode;
                changes.Add(nameof(LocalizationData.RegionCode));
            }

            foundLocalization.UpdatedAt = DateTime.UtcNow;
            try
            {
                await foundLocalization.UpdateAsyncOverride<LocalizationData, Guid>(_Db, [("localized_text", NpgsqlDbType.Jsonb)], null, [nameof(LocalizationData.UpdatedAt), .. changes]);
            }
            catch
            {
                return Unexpected();
            }

            return Response(foundLocalization);
        }
        public async Task<IResult> GetPluginLocalizations(HttpContext context, string pluginId)
        {
            var pluginGuid = DecodeIdParameter(pluginId);
            if (pluginGuid == null)
                return BadRequest();

            var localizations = _Db.GetMultipleWhen<LocalizationData, Guid>("plugin_id = @plugin_id", null,
                ("plugin_id", pluginGuid.Value));

            return Response(localizations.ToBlockingEnumerable());
        }
        #endregion

        #region Plugin DB 
        #region Global
        public async Task<IResult> GetPluginDbKeyDetails(HttpContext context, string pluginId, string dataKey)
        {
            var currentUser = AuthMiddleware.GetCurrentUser(context);
            var uuid = Guid.Parse(currentUser!.UserId);

            var pluginGuid = DecodeIdParameter(pluginId);
            if (!pluginGuid.HasValue || string.IsNullOrEmpty(dataKey))
                return BadRequest();

            var foundPlugin = (await _Db.GetByIdAsync<Plugin, Guid>(pluginGuid.Value)).Value;
            if (foundPlugin == null || foundPlugin.OwnerId != uuid)
                return Results.NotFound();

            var decodedDataKey = DecodeParameter(dataKey);
            var dataRow = (await _Db.GetByIdAsync<PluginDataRow, (string, Guid)>((decodedDataKey, pluginGuid.Value))).Value;
            if (dataRow == null)
                return Results.NotFound();

            return Response(new PluginDbDataRowResponse()
            {
                Key = dataRow.ID.Item1,
                Value = JsonDocument.Parse(dataRow.Data),

                PluginId = dataRow.ID.Item2,

                CreatedAt = dataRow.CreatedAt,
                UpdatedAt = dataRow.UpdatedAt
            });
        }
        public async Task<IResult> GetPluginDbKeyValue(HttpContext context, string pluginId, string dataKey)
        {
            var currentUser = AuthMiddleware.GetCurrentUser(context);
            var uuid = Guid.Parse(currentUser!.UserId);

            var pluginGuid = DecodeIdParameter(pluginId);
            if (!pluginGuid.HasValue || string.IsNullOrEmpty(dataKey))
                return BadRequest();

            var foundPlugin = (await _Db.GetByIdAsync<Plugin, Guid>(pluginGuid.Value)).Value;
            if (foundPlugin == null || foundPlugin.OwnerId != uuid)
                return Results.NotFound();

            var decodedDataKey = DecodeParameter(dataKey);
            var dataRow = (await _Db.GetByIdAsync<PluginDataRow, (string, Guid)>((decodedDataKey, pluginGuid.Value))).Value;
            if (dataRow == null)
                return Results.NotFound();

            return Response(JsonDocument.Parse(dataRow.Data));
        }

        public async Task<IResult> AddPluginDbKeyDetails(HttpContext context, string pluginId, string dataKey)
        {
            var currentUser = AuthMiddleware.GetCurrentUser(context);
            var uuid = Guid.Parse(currentUser!.UserId);

            var pluginGuid = DecodeIdParameter(pluginId);
            if (!pluginGuid.HasValue || string.IsNullOrEmpty(dataKey))
                return BadRequest();

            var decodedDataKey = DecodeParameter(dataKey);
            var request = await GetFromBodyAsync<AddPluginDbKeyRequest>(context);
            if (request == null)
                return BadRequest();

            var foundPlugin = (await _Db.GetByIdAsync<Plugin, Guid>(pluginGuid.Value)).Value;
            if (foundPlugin == null || foundPlugin.OwnerId != uuid)
                return Results.NotFound();

            if (!await IsPluginStorageWithinLimits(pluginGuid.Value, decodedDataKey))
                return Results.Conflict();

            var row = await new PluginDataRow()
            {
                ID = (decodedDataKey, pluginGuid.Value),
                Data = request.Data,
            }.TryInsertAsyncOverride<PluginDataRow, (string, Guid)>(_Db, false, overrides: ("data", NpgsqlDbType.Jsonb));
            if (row == null)
                return BadRequest();

            return Results.Ok();
        }
        public async Task<IResult> DeletePluginDbKey(HttpContext context, string pluginId, string dataKey)
        {
            var currentUser = AuthMiddleware.GetCurrentUser(context);
            var uuid = Guid.Parse(currentUser!.UserId);

            var pluginGuid = DecodeIdParameter(pluginId);
            if (!pluginGuid.HasValue || string.IsNullOrEmpty(dataKey))
                return BadRequest();

            var decodedDataKey = DecodeParameter(dataKey);

            var foundPlugin = (await _Db.GetByIdAsync<Plugin, Guid>(pluginGuid.Value)).Value;
            if (foundPlugin == null || foundPlugin.OwnerId != uuid)
                return Results.NotFound();

            await _Db.DeleteByIdAsync<PluginDataRow, (string, Guid)>(new PluginDataRow()
            {
                ID = (decodedDataKey, pluginGuid.Value)
            });

            return Results.Ok();
        }
        public async Task<IResult> ListPluginDbKeys(HttpContext context, string pluginId, int limit = 10, int offset = 0)
        {
            var currentUser = AuthMiddleware.GetCurrentUser(context);
            var uuid = Guid.Parse(currentUser!.UserId);

            var pluginGuid = DecodeIdParameter(pluginId);
            if (!pluginGuid.HasValue)
                return BadRequest();

            var foundPlugin = (await _Db.GetByIdAsync<Plugin, Guid>(pluginGuid.Value)).Value;
            if (foundPlugin == null || foundPlugin.OwnerId != uuid)
                return Results.NotFound();

            var keys = _Db.GetMultipleWhen<PluginDataRowResponse, Guid>(
                "plugin_id = @plugin_id LIMIT @limit OFFSET @offset",
                null,
                ("plugin_id", pluginGuid),
                ("limit", limit),
                ("offset", offset)
            );

            return Response(keys.ToBlockingEnumerable());
        }

        public async Task<bool> IsPluginStorageWithinLimits(Guid pluginId, string newData)
        {
            var result = _Db.GetMultiple<CheckPluginDbLimitsResult, int>(
                Database.CheckPluginDbLimits,
                null,
                ("plugin_id", pluginId),
                ("max_rows", PluginConstants.Plugins.Database.MaxRows),
                ("max_size", PluginConstants.Plugins.Database.MaxSize),
                ("new_data_size", newData.Length)
            ).ToBlockingEnumerable().FirstOrDefault();
            if (result == null)
                return false;

            return result.IsWithinSizeLimit && result.IsWithinRowLimit;
        }

        public async Task<IResult> GetPluginStorageLimits(HttpContext context, string pluginId)
        {
            var currentUser = AuthMiddleware.GetCurrentUser(context);
            var uuid = Guid.Parse(currentUser!.UserId);

            var pluginGuid = DecodeIdParameter(pluginId);
            if (!pluginGuid.HasValue)
                return BadRequest();

            var foundPlugin = (await _Db.GetByIdAsync<Plugin, Guid>(pluginGuid.Value)).Value;
            if (foundPlugin == null || foundPlugin.OwnerId != uuid)
                return Results.NotFound();

            var result = _Db.GetMultiple<CheckPluginDbLimitsResult, int>(Database.GetPluginDbStats, null,
                ("plugin_id", pluginGuid.Value),
                ("max_rows", PluginConstants.Plugins.Database.MaxRows),
                ("max_size", PluginConstants.Plugins.Database.MaxSize),
                ("new_data_size", 0)).ToBlockingEnumerable().FirstOrDefault();
            if (result == null)
                return Unexpected();

            return Response(new CheckPluginDbStatsResponse()
            {
                OccupiedSize = result.OccupiedSize,
                SizeMaxLimit = PluginConstants.Plugins.Database.MaxSize,

                RowMaxLimit = PluginConstants.Plugins.Database.MaxRows,
                TotalRows = result.Rows
            });
        }
        #endregion

        #region User
        public async Task<IResult> GetPluginUserDbKeyDetails(HttpContext context, string pluginId, string dataKey)
        {
            var currentUser = AuthMiddleware.GetCurrentUser(context);
            var uuid = Guid.Parse(currentUser!.UserId);

            var pluginGuid = DecodeIdParameter(pluginId);
            if (!pluginGuid.HasValue || string.IsNullOrEmpty(dataKey))
                return BadRequest();

            var foundPlugin = (await _Db.GetByIdAsync<Plugin, Guid>(pluginGuid.Value)).Value;
            if (foundPlugin == null)
                return Results.NotFound();

            var decodedDataKey = DecodeParameter(dataKey);
            var dataRow = (await _Db.GetByIdAsync<PluginUserDataRow, (string, Guid, Guid)>((decodedDataKey, pluginGuid.Value, uuid))).Value;
            if (dataRow == null)
                return Results.NotFound();

            return Response(new PluginDbDataRowResponse()
            {
                Key = dataRow.ID.Item1,
                Value = JsonDocument.Parse(dataRow.Data),

                PluginId = dataRow.ID.Item2,

                CreatedAt = dataRow.CreatedAt,
                UpdatedAt = dataRow.UpdatedAt
            });
        }
        public async Task<IResult> DeletePluginUserDbKey(HttpContext context, string pluginId, string dataKey)
        {
            var currentUser = AuthMiddleware.GetCurrentUser(context);
            var uuid = Guid.Parse(currentUser!.UserId);

            var pluginGuid = DecodeIdParameter(pluginId);
            if (!pluginGuid.HasValue || string.IsNullOrEmpty(dataKey))
                return BadRequest();

            var decodedDataKey = DecodeParameter(dataKey);

            var foundPlugin = (await _Db.GetByIdAsync<Plugin, Guid>(pluginGuid.Value)).Value;
            if (foundPlugin == null || foundPlugin.OwnerId != uuid)
                return Results.NotFound();

            await _Db.DeleteByIdAsync<PluginUserDataRow, (string, Guid, Guid)>(new PluginUserDataRow()
            {
                ID = (decodedDataKey, pluginGuid.Value, uuid),
            });

            return Results.Ok();
        }
        public async Task<IResult> DeletePluginUserAllDbKeys(HttpContext context, string pluginId)
        {
            var currentUser = AuthMiddleware.GetCurrentUser(context);
            var uuid = Guid.Parse(currentUser!.UserId);

            var pluginGuid = DecodeIdParameter(pluginId);
            if (!pluginGuid.HasValue)
                return BadRequest();

            var foundPlugin = (await _Db.GetByIdAsync<Plugin, Guid>(pluginGuid.Value)).Value;
            if (foundPlugin == null || foundPlugin.OwnerId != uuid)
                return Results.NotFound();

            await _Db.ExecuteNonQueryAsync($"DELETE FROM {Tables.PluginUserDataRow} WHERE plugin_id = @plugin_id AND user_id = @user_id", null,
                ("plugin_id", foundPlugin.ID),
                ("user_id", uuid));

            return Results.Ok();
        }

        public async Task<IResult> GetPluginUserDbKeyValue(HttpContext context, string pluginId, string dataKey)
        {
            var currentUser = AuthMiddleware.GetCurrentUser(context);
            var uuid = Guid.Parse(currentUser!.UserId);

            var pluginGuid = DecodeIdParameter(pluginId);
            if (!pluginGuid.HasValue || string.IsNullOrEmpty(dataKey))
                return BadRequest();

            var foundPlugin = (await _Db.GetByIdAsync<Plugin, Guid>(pluginGuid.Value)).Value;
            if (foundPlugin == null)
                return Results.NotFound();

            var decodedDataKey = DecodeParameter(dataKey);
            var dataRow = (await _Db.GetByIdAsync<PluginUserDataRow, (string, Guid, Guid)>((decodedDataKey, pluginGuid.Value, uuid))).Value;
            if (dataRow == null)
                return Results.NotFound();

            return Response(JsonDocument.Parse(dataRow.Data));
        }
        public async Task<IResult> AddPluginUserDbKeyDetails(HttpContext context, string pluginId, string dataKey)
        {
            var currentUser = AuthMiddleware.GetCurrentUser(context);
            var uuid = Guid.Parse(currentUser!.UserId);

            var pluginGuid = DecodeIdParameter(pluginId);
            if (!pluginGuid.HasValue || string.IsNullOrEmpty(dataKey))
                return BadRequest();

            var decodedDataKey = DecodeParameter(dataKey);
            var request = await GetFromBodyAsync<AddPluginDbKeyRequest>(context);
            if (request == null)
                return BadRequest();

            var foundPlugin = (await _Db.GetByIdAsync<Plugin, Guid>(pluginGuid.Value)).Value;
            if (foundPlugin == null)
                return Results.NotFound();

            if (!await IsPluginUserStorageWithinLimits(pluginGuid.Value, uuid, decodedDataKey))
                return Results.Conflict();

            var row = await new PluginUserDataRow()
            {
                ID = (decodedDataKey, pluginGuid.Value, uuid),
                Data = request.Data,
                RemoveAtUninstall = request.RemoveAtUninstall.HasValue ? request.RemoveAtUninstall.Value : true
            }.TryInsertAsync<PluginUserDataRow, (string, Guid, Guid)>(_Db, false);
            if (row == null)
                return Unexpected();

            return Results.Ok();
        }

        public async Task<bool> IsPluginUserStorageWithinLimits(Guid pluginId, Guid userId, string newData)
        {
            var result = _Db.GetMultiple<CheckPluginDbLimitsResult, int>(
                Database.CheckPluginUserDbLimits,
                null,
                ("plugin_id", pluginId),
                ("user_id", userId),
                ("max_rows", PluginConstants.Plugins.Database.MaxUserRows),
                ("max_size", PluginConstants.Plugins.Database.MaxUserSize),
                ("new_data_size", newData.Length)
            ).ToBlockingEnumerable().FirstOrDefault();
            if (result == null)
                return false;

            return result.IsWithinSizeLimit && result.IsWithinRowLimit;
        }
        public async Task<IResult> GetPluginUserStorageLimits(HttpContext context, string pluginId)
        {
            var currentUser = AuthMiddleware.GetCurrentUser(context);
            var uuid = Guid.Parse(currentUser!.UserId);

            var pluginGuid = DecodeIdParameter(pluginId);
            if (!pluginGuid.HasValue)
                return BadRequest();

            var foundPlugin = (await _Db.GetByIdAsync<Plugin, Guid>(pluginGuid.Value)).Value;
            if (foundPlugin == null)
                return Results.NotFound();

            var result = _Db.GetMultiple<CheckPluginDbLimitsResult, int>(Database.GetPluginUserDbStats, null,
                ("plugin_id", pluginGuid.Value),
                ("user_id", uuid),
                ("max_rows", PluginConstants.Plugins.Database.MaxUserRows),
                ("max_size", PluginConstants.Plugins.Database.MaxUserSize),
                ("new_data_size", 0)).ToBlockingEnumerable().FirstOrDefault();
            if (result == null)
                return Results.NotFound();

            return Response(new CheckPluginDbStatsResponse()
            {
                OccupiedSize = result.OccupiedSize,
                SizeMaxLimit = PluginConstants.Plugins.Database.MaxUserSize,

                RowMaxLimit = PluginConstants.Plugins.Database.MaxUserRows,
                TotalRows = result.Rows
            });
        }
        #endregion
        #endregion
        public async Task<IResult> CreateNewPluginVersion(HttpContext context, string pluginId)
        {
            var currentUser = AuthMiddleware.GetCurrentUser(context);
            var uuid = Guid.Parse(currentUser!.UserId);

            var decodedPluginId = DecodeIdParameter(pluginId);
            if (!decodedPluginId.HasValue)
                return BadRequest();

            var foundPlugin = (await _Db.GetByIdAsync<Plugin, Guid>(decodedPluginId.Value)).Value;
            if (foundPlugin == null || foundPlugin.OwnerId != uuid)
                return Results.NotFound();

            var request = await CreateNewPluginVersionRequest.FromContextAsync(context);
            if (request == null || request.VersionString == null || request.SystemApiVersion == null)
                return BadRequest();

            var versionId = Guid.NewGuid();
            var version = new PluginVersion()
            {
                ID = versionId,
                PluginId = decodedPluginId.Value,
                SystemApiVersion = request.SystemApiVersion,
                VersionString = request.VersionString,
                IsActive = request.IsActive ?? true,
                IsBeta = request.IsBeta ?? false,
                ReleaseNotes = request.ReleaseNotes,
                PublishStatus = PublishStatus.Preparing,
                VerificationStatus = VerificationStatus.Unverified
            };

            if (request.Config != null)
            {
                if (request.Config.Length > PluginConstants.Plugins.MaxConfigSize)
                    return BadRequest();

                var extension = Path.GetExtension(request.Config.FileName);
                if (extension != ".json")
                    return BadRequest();

                using var streamReader = new StreamReader(request.Config.OpenReadStream());
                string jsonContent = await streamReader.ReadToEndAsync();

                // DB is checking JSON validity using JSONB
                version.Config = jsonContent;
            }

            if (request.Module != null)
            {
                if (request.Module.Length > PluginConstants.Plugins.MaxModuleSize)
                    return BadRequest();

                var extension = Path.GetExtension(request.Module.FileName);
                if (extension != ".wasm")
                    return BadRequest();

                var moduleUrl = await _Storage.UploadPluginVersionModule(foundPlugin.ID, version.ID, request.Module);
                if (moduleUrl == null)
                    return BadRequest();

                version.WasmBundleUrl = moduleUrl;
            }


            version = await version.TryInsertAsyncOverride<PluginVersion, Guid>(_Db, false, null, null, ("config", NpgsqlDbType.Jsonb));
            if (version == null)
                return Unexpected();

            return Response(version);
        }
        public async Task<IResult> EditPluginVersion(HttpContext context, string pluginId, string versionId)
        {
            var currentUser = AuthMiddleware.GetCurrentUser(context);
            var uuid = Guid.Parse(currentUser!.UserId);

            var decodedPluginId = DecodeIdParameter(pluginId);
            if (!decodedPluginId.HasValue)
                return BadRequest();

            var decodedVersionId = DecodeIdParameter(versionId);
            if (!decodedVersionId.HasValue)
                return BadRequest();

            var foundPlugin = (await _Db.GetByIdAsync<Plugin, Guid>(decodedPluginId.Value)).Value;
            if (foundPlugin == null || foundPlugin.OwnerId != uuid)
                return Results.NotFound();

            var request = await CreateNewPluginVersionRequest.FromContextAsync(context);
            if (request == null || request.VersionString != null)
                return BadRequest();

            var changes = new List<string>();
            var version = (await _Db.GetByIdAsync<PluginVersion, Guid>(decodedVersionId.Value)).Value;
            if (version == null || version.PluginId != foundPlugin.ID)
                return Results.NotFound();

            if (request.IsBeta.HasValue)
            {
                version.IsBeta = request.IsBeta.Value;
                changes.Add(nameof(PluginVersion.IsBeta));
            }

            if (request.IsActive.HasValue)
            {
                version.IsActive = request.IsActive.Value;
                changes.Add(nameof(PluginVersion.IsActive));
            }

            if (request.ReleaseNotes != null)
            {
                version.ReleaseNotes = request.ReleaseNotes;
                changes.Add(nameof(PluginVersion.ReleaseNotes));
            }

            if (request.Config != null)
            {
                if (request.Config.Length > PluginConstants.Plugins.MaxConfigSize)
                    return BadRequest();

                var extension = Path.GetExtension(request.Config.FileName);
                if (extension != ".json")
                    return BadRequest();

                using var streamReader = new StreamReader(request.Config.OpenReadStream());
                string jsonContent = await streamReader.ReadToEndAsync();

                // DB is checking JSON validity using JSONB
                version.Config = jsonContent;
                changes.Add(nameof(PluginVersion.Config));
            }

            if (request.Module != null)
            {
                if (request.Module.Length > PluginConstants.Plugins.MaxModuleSize)
                    return BadRequest();

                var extension = Path.GetExtension(request.Module.FileName);
                if (extension != ".wasm")
                    return BadRequest();

                var moduleUrl = await _Storage.UploadPluginVersionModule(foundPlugin.ID, version.ID, request.Module);
                if (moduleUrl == null)
                    return BadRequest();

                version.WasmBundleUrl = moduleUrl;
                changes.Add(nameof(PluginVersion.WasmBundleUrl));
            }

            version.UpdatedAt = DateTime.UtcNow;
            await version.UpdateAsync<PluginVersion, Guid>(_Db, null, [.. changes, nameof(PluginVersion.UpdatedAt)]);

            return Response(version);
        }
        public async Task<IResult> RemovePluginVersion(HttpContext context, string pluginId, string versionId)
        {
            var currentUser = AuthMiddleware.GetCurrentUser(context);
            var uuid = Guid.Parse(currentUser!.UserId);

            var decodedPluginId = DecodeIdParameter(pluginId);
            if (!decodedPluginId.HasValue)
                return BadRequest();

            var decodedVersionId = DecodeIdParameter(versionId);
            if (!decodedVersionId.HasValue)
                return BadRequest();


            var foundPlugin = (await _Db.GetByIdAsync<Plugin, Guid>(decodedPluginId.Value)).Value;
            if (foundPlugin == null || foundPlugin.OwnerId != uuid)
                return Results.NotFound();

            var changes = new List<string>();
            var version = (await _Db.GetByIdAsync<PluginVersion, Guid>(decodedVersionId.Value)).Value;
            if (version == null || version.PluginId != foundPlugin.ID)
                return Results.NotFound();

            await _Storage.RemovePluginVersion(foundPlugin.ID, version.ID);
            await _Db.DeleteByIdAsync<PluginVersion, Guid>(version);

            return Results.Ok();
        }

        public async Task<IResult> PublishPluginVersion(HttpContext context, string pluginId, string versionId)
        {
            var currentUser = AuthMiddleware.GetCurrentUser(context);
            var uuid = Guid.Parse(currentUser!.UserId);

            var decodedPluginId = DecodeIdParameter(pluginId);
            if (!decodedPluginId.HasValue)
                return BadRequest();

            var decodedVersionId = DecodeIdParameter(versionId);
            if (!decodedVersionId.HasValue)
                return BadRequest();

            var foundPlugin = (await _Db.GetByIdAsync<Plugin, Guid>(decodedPluginId.Value)).Value;
            if (foundPlugin == null || foundPlugin.OwnerId != uuid)
                return Results.NotFound();

            // Plugin chceck
            if ((foundPlugin.PaymentType == PaymentType.OneTime &&
                foundPlugin.Price == null) ||
                foundPlugin.IsActive == false)
                return Results.Conflict();

            // Plugin version requirements
            var foundVersion = (await _Db.GetByIdAsync<PluginVersion, Guid>(decodedVersionId.Value)).Value;
            if (foundVersion == null)
                return Results.NotFound();

            if (string.IsNullOrEmpty(foundVersion.Config) ||
                string.IsNullOrEmpty(foundVersion.WasmBundleUrl) ||
                foundVersion.PublishStatus != PublishStatus.Preparing)
                return Results.Conflict();

            foundVersion.PublishStatus = PublishStatus.Published; // TODO: This needs to be set to Reviewing -> Admin Panel needed!
            foundVersion.UpdatedAt = DateTime.UtcNow;
            foundVersion.VerificationStatus = VerificationStatus.Verified; // TODO: This needs to be set to Unverified and is run after the sec team reviewed the plugin then its set to Pending and then to Verified/Malicious -> Admin Panel needed!
            await foundVersion.UpdateAsync<PluginVersion, Guid>(_Db, null, nameof(PluginVersion.PublishStatus), nameof(PluginVersion.VerificationStatus), nameof(PluginVersion.UpdatedAt));

            foundPlugin.PublishStatus = PublishStatus.Published; // TODO: This needs to be set to Reviewing -> Admin Panel needed!
            foundPlugin.VerificationStatus = VerificationStatus.Verified; // TODO: This needs to be set to Unverified and is run after the sec team reviewed the plugin then its set to Pending and then to Verified/Malicious -> Admin Panel needed!
            foundPlugin.UpdatedAt = DateTime.UtcNow;
            await foundPlugin.UpdateAsync<Plugin, Guid>(_Db, null, nameof(Plugin.PublishStatus), nameof(Plugin.VerificationStatus), nameof(Plugin.UpdatedAt));
            return Results.Ok();
        }

        // MEDIUM - Make the AdminOnly a UserRole which will allow roles instead of just admin
        [Auth(AdminOnly = true)]
        public async Task<IResult> ReviewPluginVersion(HttpContext context, string pluginId, string versionId)
        {
            var currentUser = AuthMiddleware.GetCurrentUser(context);
            var uuid = Guid.Parse(currentUser!.UserId);

            var decodedPluginId = DecodeIdParameter(pluginId);
            if (!decodedPluginId.HasValue)
                return BadRequest();

            var decodedVersionId = DecodeIdParameter(versionId);
            if (!decodedVersionId.HasValue)
                return BadRequest();

            var foundPlugin = (await _Db.GetByIdAsync<Plugin, Guid>(decodedPluginId.Value)).Value;
            if (foundPlugin == null || foundPlugin.OwnerId != uuid)
                return Results.NotFound();

            var request = await GetFromBodyAsync<ReviewPluginVersionRequest>(context);
            if (request == null)
                return BadRequest();

            var changes = new List<string>();
            var version = (await _Db.GetByIdAsync<PluginVersion, Guid>(decodedVersionId.Value)).Value;
            if (version == null || version.PluginId != foundPlugin.ID)
                return Results.NotFound();

            version.PublishStatus = request.IsOk ? PublishStatus.Published : PublishStatus.TakenDown;
            version.VerificationStatus = request.IsOk ? VerificationStatus.Malicious : VerificationStatus.Verified;
            version.VerificationNotes = request.ReviewNotes;
            version.UpdatedAt = DateTime.UtcNow;
            await version.UpdateAsync<PluginVersion, Guid>(_Db, null,
                nameof(PluginVersion.VerificationStatus),
                nameof(PluginVersion.VerificationNotes),
                nameof(PluginVersion.PublishStatus),
                nameof(PluginVersion.UpdatedAt));

            return Results.Ok();
        }
        #endregion

        #region Logs
        public async Task<IResult> LogPluginLog(HttpContext context, string pluginId)
        {
            return Results.Ok("[]");
        }
        public async Task<IResult> QueryPluginLogs(HttpContext context, string pluginId)
        {
            return Results.Ok("[]");
        }
        #endregion

        private string DecodeParameter(string paramValue)
        {
            return Encoding.UTF8.GetString(Convert.FromBase64String(paramValue));
        }
        private Guid? DecodeIdParameter(string paramValue)
        {
            var decoded = DecodeParameter(paramValue);
            if (Guid.TryParse(decoded, out Guid result))
                return result;

            return null;
        }

        public override void MapRoutes(IEndpointRouteBuilder routeBuilder)
        {
            routeBuilder.MapPost("/query", (Delegate)QueryPlugins);

            var group = routeBuilder.MapGroup("/store");
            group.MapGet("/", (Delegate)GetPluginStorePageDetails);
            group.MapPost("/hot", (Delegate)GetHotPlugins);
            group.MapPost("/new", (Delegate)GetNewArrivalsPlugins);
            group.MapPost("/staff", (Delegate)GetStaffPicksPlugins);
            group.MapPost("/recommend", (Delegate)GetRecommendedForYouPlugins);

            group.MapGet("/{pluginId}", (Delegate)GetPluginDetails);
            group.MapGet("/{pluginId}/versions", (Delegate)GetPluginVersions);
            group.MapGet("/{pluginId}/versions/{versionId}", (Delegate)GetPluginVersionDetails);

            group.MapPost("/{pluginId}/report", (Delegate)ReportPlugin);

            // Reviews
            group.MapGet("/{pluginId}/reviews", (Delegate)ListPluginReviews);
            group.MapPost("/{pluginId}/reviews", (Delegate)AddOrEditPluginReview);
            group.MapDelete("/{pluginId}/reviews", (Delegate)RemovePluginReview);
            group.MapPost("/{pluginId}/reviews/{reviewId}", (Delegate)ReportPluginReview);

            group = routeBuilder.MapGroup("/manage");
            group.MapPost("/create", (Delegate)CreateNewPlugin);
            group.MapPatch("/{pluginId}", (Delegate)EditPlugin);
            group.MapDelete("/{pluginId}", (Delegate)DeletePlugin);

            group.MapGet("/assets/{pluginId}", (Delegate)GetPluginAssets);
            group.MapGet("/assets/{pluginId}/cache", (Delegate)CachePluginAssets);
            group.MapPost("/assets/{pluginId}", (Delegate)UploadPluginAssets);
            group.MapPatch("/assets/{pluginId}/{assetId}", (Delegate)EditPluginAsset);
            group.MapGet("/assets/{pluginId}/{assetId}/store", (Delegate)SetPluginAssetAsStoreAsset);
            group.MapDelete("/assets/{pluginId}/{assetId}/store", (Delegate)RemovePluginAssetAsStoreAsset);
            group.MapPatch("/assets/{pluginId}/{assetId}/store", (Delegate)EditPluginAssetAsStoreAsset);
            group.MapDelete("/assets/{pluginId}", (Delegate)RemovePluginAssets);

            group.MapGet("/localizations/{pluginId}", (Delegate)GetPluginLocalizations);
            group.MapPost("/localizations/{pluginId}", (Delegate)AddPluginLocalization);
            group.MapPatch("/localizations/{pluginId}/{localizationId}", (Delegate)EditPluginLocalization);
            group.MapDelete("/localizations/{pluginId}", (Delegate)RemovePluginLocalizations);

            // Plugin DB
            var storageGroup = group.MapGroup("/{pluginId}/storage");
            storageGroup.MapGet("/{dataKey}", (Delegate)GetPluginDbKeyDetails);
            storageGroup.MapGet("/{dataKey}/value", (Delegate)GetPluginDbKeyValue);

            storageGroup.MapGet("/", (Delegate)ListPluginDbKeys);
            storageGroup.MapGet("/limits", (Delegate)GetPluginStorageLimits);
            storageGroup.MapPut("/{dataKey}", (Delegate)AddPluginDbKeyDetails);
            storageGroup.MapDelete("/{dataKey}", (Delegate)DeletePluginDbKey);

            // User DB
            storageGroup = group.MapGroup("/{pluginId}/user/storage");
            storageGroup.MapGet("/", (Delegate)GetPluginUserStorageLimits);

            storageGroup.MapGet("/{dataKey}", (Delegate)GetPluginUserDbKeyValue);
            storageGroup.MapGet("/{dataKey}/value", (Delegate)GetPluginUserDbKeyValue);
            storageGroup.MapPut("/{dataKey}", (Delegate)AddPluginUserDbKeyDetails);
            storageGroup.MapDelete("/{dataKey}", (Delegate)DeletePluginUserDbKey);
            storageGroup.MapDelete("/", (Delegate)DeletePluginUserAllDbKeys);

            // Plugin Versions
            group.MapPost("/{pluginId}/version", (Delegate)CreateNewPluginVersion);
            group.MapPost("/{pluginId}/version/{versionId}", (Delegate)EditPluginVersion);
            group.MapDelete("/{pluginId}/version/{versionId}", (Delegate)RemovePluginVersion);

            group.MapPost("/{pluginId}/publish/{versionId}", (Delegate)PublishPluginVersion);

            // MEDIUM - Create fast admin webpage for plugin reviewing even with their code
            group.MapPost("/{pluginId}/review/{versionId}", (Delegate)ReviewPluginVersion);

            // Logging
            // LOW - Provide method to log plugin security logs
            routeBuilder.MapPost("/logs/{pluginId}", (Delegate)LogPluginLog);
            routeBuilder.MapGet("/logs/{pluginId}", (Delegate)QueryPluginLogs);
        }
    }
}
