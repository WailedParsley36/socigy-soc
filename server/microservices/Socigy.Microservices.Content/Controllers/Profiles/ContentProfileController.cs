using Amazon;
using Grpc.Net.ClientFactory;
using OpenTelemetry;
using Org.BouncyCastle.Utilities.Encoders;
using Socigy.Connectors.User.Info;
using Socigy.Microservices.Content.Requests;
using Socigy.Microservices.Content.Responses;
using Socigy.Microservices.Content.Structures.Categorization;
using Socigy.Microservices.Content.Structures.Profiles;
using Socigy.Middlewares;
using Socigy.Middlewares.Attributes;
using Socigy.Services.Communication;
using Socigy.Services.Database;
using Socigy.Services.Database.Enums;
using Socigy.Structures;
using System.Collections.Generic;
using System.Text;
using System.Text.Json.Serialization.Metadata;

namespace Socigy.Microservices.Content.Controllers.Profiles
{
    [Auth]
    public class ContentProfileController : BaseApiController
    {
        private readonly IDatabaseService _Db;
        private readonly UserInfoGrpcService.UserInfoGrpcServiceClient _User;
        public ContentProfileController(IJsonTypeInfoResolver jsonTypeInfoResolver, IDatabaseService db, UserInfoGrpcService.UserInfoGrpcServiceClient user) : base(jsonTypeInfoResolver)
        {
            _Db = db;
            _User = user;
        }

        #region Catergories and Interests
        public async Task<IResult> GetPreferedCategories(HttpContext context, string profileId, int limit = 15, int offset = 0, CancellationToken cancellationToken = default)
        {
            var request = await RequestAsync<SetProfileContentPreferencesRequest>(context);
            if (request.Error != null)
                return request.Error;

            var currentUser = AuthMiddleware.GetCurrentUser(context)!;
            var uuid = Guid.Parse(currentUser.UserId);

            var parsedProfileId = DecodeProfileName(profileId);
            if (parsedProfileId == null)
                return BadRequest();

            var profile = await GetOrCreateDefaultProfile(uuid, parsedProfileId.Value);
            if (profile == null)
                return BadRequest();

            var categories = _Db.GetMultiple<Category, Guid>(SQLCommands.ContentProfiles.GetProfileCategories, null,
                ("limit", limit),
                ("offset", offset),
                ("content_profile_id", profile.ID));

            return Response(categories.ToBlockingEnumerable());
        }
        public async Task<IResult> GetPreferedInterests(HttpContext context, string profileId, int limit = 15, int offset = 0, CancellationToken cancellationToken = default)
        {
            var request = await RequestAsync<SetProfileContentPreferencesRequest>(context);
            if (request.Error != null)
                return request.Error;

            var currentUser = AuthMiddleware.GetCurrentUser(context)!;
            var uuid = Guid.Parse(currentUser.UserId);

            var parsedProfileId = DecodeProfileName(profileId);
            if (parsedProfileId == null)
                return BadRequest();

            var profile = await GetOrCreateDefaultProfile(uuid, parsedProfileId.Value);
            if (profile == null)
                return BadRequest();

            var categories = _Db.GetMultiple<Interest, Guid>(SQLCommands.ContentProfiles.GetProfileInterests, null,
                ("limit", limit),
                ("offset", offset),
                ("content_profile_id", profile.ID));

            return Response(categories.ToBlockingEnumerable());
        }

        public async Task<IResult> UpdatePreferedCategories(HttpContext context, string profileId)
        {
            var request = await RequestAsync<SetProfileContentPreferencesRequest>(context);
            if (request.Error != null)
                return request.Error;

            var currentUser = AuthMiddleware.GetCurrentUser(context)!;
            var uuid = Guid.Parse(currentUser.UserId);

            var parsedProfileId = DecodeProfileName(profileId);
            if (parsedProfileId == null)
                return BadRequest();

            var profile = await GetOrCreateDefaultProfile(uuid, parsedProfileId.Value);
            if (profile == null || profile.IsDefault)
                return BadRequest();

            var batch = await _Db.CreateBatchAsync();
            foreach (var category in request.Result!.Preferences)
            {
                await _Db.BatchInsertAsync<ContentProfileCategory, (Guid, Guid)>(batch, new ContentProfileCategory()
                {
                    ID = (profile.ID, category.ContentId),
                    Weight = category.Weight
                }, false, conflictHandling: DbConflictHandling.UpdateExisting);
            }
            await batch.ExecuteNonQueryAsync();

            return Results.Ok();
        }
        public async Task<IResult> UpdatePreferedInterests(HttpContext context, string profileId)
        {
            var request = await RequestAsync<SetProfileContentPreferencesRequest>(context);
            if (request.Error != null)
                return request.Error;

            var currentUser = AuthMiddleware.GetCurrentUser(context)!;
            var uuid = Guid.Parse(currentUser.UserId);

            var parsedProfileId = DecodeProfileName(profileId);
            if (parsedProfileId == null)
                return BadRequest();

            var profile = await GetOrCreateDefaultProfile(uuid, parsedProfileId.Value);
            if (profile == null || profile.IsDefault)
                return BadRequest();

            var batch = await _Db.CreateBatchAsync();
            foreach (var interest in request.Result!.Preferences)
            {
                await _Db.BatchInsertAsync<ContentProfileInterest, (Guid, Guid)>(batch, new ContentProfileInterest()
                {
                    ID = (profile.ID, interest.ContentId),
                    Weight = interest.Weight
                }, false, conflictHandling: DbConflictHandling.UpdateExisting);
            }
            await batch.ExecuteNonQueryAsync();

            return Results.Ok();
        }

        public async Task<IResult> SetPreferedCategories(HttpContext context, string profileId)
        {
            var request = await RequestAsync<SetProfileContentPreferencesRequest>(context);
            if (request.Error != null)
                return request.Error;

            var currentUser = AuthMiddleware.GetCurrentUser(context)!;
            var uuid = Guid.Parse(currentUser.UserId);

            var parsedProfileId = DecodeProfileName(profileId);
            if (parsedProfileId == null)
                return BadRequest();

            var profile = await GetOrCreateDefaultProfile(uuid, parsedProfileId.Value);
            if (profile == null || profile.IsDefault)
                return BadRequest();

            var batch = await _Db.CreateBatchAsync();
            _Db.AddBatchCommand(batch, $"DELETE FROM {_Db.GetTableName<ContentProfileCategory>()} WHERE content_profile = @profile_id",
                ("profile_id", profile.ID));

            foreach (var category in request.Result!.Preferences)
            {
                await _Db.BatchInsertAsync<ContentProfileCategory, (Guid, Guid)>(batch, new ContentProfileCategory()
                {
                    ID = (profile.ID, category.ContentId),
                    Weight = category.Weight
                }, false, conflictHandling: DbConflictHandling.UpdateExisting);
            }
            await batch.ExecuteNonQueryAsync();

            return Results.Ok();
        }
        public async Task<IResult> SetPreferedInterests(HttpContext context, string profileId)
        {
            var request = await RequestAsync<SetProfileContentPreferencesRequest>(context);
            if (request.Error != null)
                return request.Error;

            var currentUser = AuthMiddleware.GetCurrentUser(context)!;
            var uuid = Guid.Parse(currentUser.UserId);

            var parsedProfileId = DecodeProfileName(profileId);
            if (parsedProfileId == null)
                return BadRequest();

            var profile = await GetOrCreateDefaultProfile(uuid, parsedProfileId.Value);
            if (profile == null || profile.IsDefault)
                return BadRequest();

            var batch = await _Db.CreateBatchAsync();
            _Db.AddBatchCommand(batch, $"DELETE FROM {_Db.GetTableName<ContentProfileInterest>()} WHERE content_profile = @profile_id",
                ("profile_id", profile.ID));

            foreach (var interest in request.Result!.Preferences)
            {
                await _Db.BatchInsertAsync<ContentProfileInterest, (Guid, Guid)>(batch, new ContentProfileInterest()
                {
                    ID = (profile.ID, interest.ContentId),
                    Weight = interest.Weight
                }, false, conflictHandling: DbConflictHandling.UpdateExisting);
            }
            await batch.ExecuteNonQueryAsync();

            return Results.Ok();
        }

        public async Task<IResult> DeletePreferedCategories(HttpContext context, string profileId)
        {
            var request = await RequestAsync<SetProfileContentPreferencesRequest>(context);
            if (request.Error != null)
                return request.Error;

            var currentUser = AuthMiddleware.GetCurrentUser(context)!;
            var uuid = Guid.Parse(currentUser.UserId);

            var parsedProfileId = DecodeProfileName(profileId);
            if (parsedProfileId == null)
                return BadRequest();

            var profile = await GetOrCreateDefaultProfile(uuid, parsedProfileId.Value);
            if (profile == null || profile.IsDefault)
                return BadRequest();

            await _Db.ExecuteNonQueryAsync($"DELETE FROM {_Db.GetTableName<ContentProfileCategory>()} WHERE content_profile = @profile_id", null,
                ("profile_id", profile.ID));

            return Results.Ok();
        }
        public async Task<IResult> DeletePreferedInterests(HttpContext context, string profileId)
        {
            var request = await RequestAsync<SetProfileContentPreferencesRequest>(context);
            if (request.Error != null)
                return request.Error;

            var currentUser = AuthMiddleware.GetCurrentUser(context)!;
            var uuid = Guid.Parse(currentUser.UserId);

            var parsedProfileId = DecodeProfileName(profileId);
            if (parsedProfileId == null)
                return BadRequest();

            var profile = await GetOrCreateDefaultProfile(uuid, parsedProfileId.Value);
            if (profile == null || profile.IsDefault)
                return BadRequest();

            await _Db.ExecuteNonQueryAsync($"DELETE FROM {_Db.GetTableName<ContentProfileInterest>()} WHERE content_profile = @profile_id", null,
                ("profile_id", profile.ID));

            return Results.Ok();
        }
        #endregion

        #region Profiles
        public async Task<IResult> CreateContentProfile(HttpContext context)
        {
            var request = await GetFromBodyAsync<ContentProfileRequest>(context);
            if (request == null)
                return BadRequest();

            var currentUser = AuthMiddleware.GetCurrentUser(context)!;
            var uuid = Guid.Parse(currentUser.UserId);

            var newProfile = await new UserContentProfile()
            {
                ID = Guid.NewGuid(),
                Description = request.Description,
                Name = request.Name ?? "Unnamed Profile",
                IsDefault = false,
                Owner = uuid,
                Visibility = request.Visibility ?? Socigy.Structures.Enums.ContentProfileVisibility.Private
            }.TryInsertAsync<UserContentProfile, Guid>(_Db, false);
            if (newProfile == null)
                return Unexpected();

            return Response(new CreateContentProfileResponse() { NewId = newProfile.ID });
        }
        public async Task<IResult> DeleteContentProfile(HttpContext context)
        {
            var request = await GetFromBodyAsync<ContentProfileRequest>(context);
            if (request == null || request.Id == null)
                return BadRequest();

            var currentUser = AuthMiddleware.GetCurrentUser(context)!;
            var uuid = Guid.Parse(currentUser.UserId);

            await _Db.ExecuteNonQueryAsync($"DELETE FROM {_Db.GetTableName<UserContentProfile>()} WHERE id = @id AND owner_uuid = @user_id AND is_default = FALSE", null,
                ("user_id", uuid),
                ("id", request.Id.Value));

            return Results.Ok();
        }
        public async Task<IResult> EditContentProfile(HttpContext context)
        {
            var request = await GetFromBodyAsync<ContentProfileRequest>(context);
            if (request == null || request.Id == null)
                return BadRequest();

            var currentUser = AuthMiddleware.GetCurrentUser(context)!;
            var uuid = Guid.Parse(currentUser.UserId);

            List<string> changes = [nameof(UserContentProfile.Description), nameof(UserContentProfile.Name)];
            if (request.Visibility != null)
                changes.Add(nameof(UserContentProfile.Visibility));

            var contentProfile = (await _Db.GetByIdAsync<UserContentProfile, Guid>(request.Id.Value)).Value;
            if (contentProfile == null || contentProfile.IsDefault)
                return BadRequest();

            await new UserContentProfile()
            {
                ID = request.Id.Value,
                Description = request.Description,
                Name = request.Name!,
                Visibility = request.Visibility ?? Socigy.Structures.Enums.ContentProfileVisibility.Private
            }.UpdateAsync<UserContentProfile, Guid>(_Db, null, [.. changes]);

            return Results.Ok();
        }
        #endregion

        #region Queries
        [Auth(false, true)]
        public async Task<IResult> GetPopularCategories(HttpContext context, int limit = 32, int offset = 0)
        {
            var categories = _Db.GetMultiple<Category, Guid>(SQLCommands.ContentProfiles.PopularCategories, null,
                ("limit", limit),
                ("offset", offset));

            return Response(categories.ToBlockingEnumerable());
        }
        [Auth(false, true)]
        public async Task<IResult> GetPopularInterests(HttpContext context, int limit = 32, int offset = 0)
        {
            var categories = _Db.GetMultiple<Interest, Guid>(SQLCommands.ContentProfiles.PopularInterests, null,
                ("limit", limit),
                ("offset", offset));

            return Response(categories.ToBlockingEnumerable());
        }
        public async Task<IResult> GetRecommendedInterests(HttpContext context, string profileId, int limit = 32, int offset = 0)
        {
            var currentUser = AuthMiddleware.GetCurrentUser(context)!;
            var uuid = Guid.Parse(currentUser.UserId);

            var parsedProfileId = DecodeProfileName(profileId);
            if (parsedProfileId == null)
                return BadRequest();

            var profile = await GetOrCreateDefaultProfile(uuid, parsedProfileId.Value);
            if (profile == null)
                return BadRequest();

            var categories = _Db.GetMultiple<Interest, Guid>(SQLCommands.ContentProfiles.RecommendedInterests, null,
                ("content_profile_id", profile.ID),
                ("limit", limit),
                ("offset", offset));

            return Response(categories.ToBlockingEnumerable());
        }
        #endregion

        #region Registration
        [Auth(false, true)]
        public async Task<IResult> SetDefaultPreferedCategories(HttpContext context)
        {
            var request = await RequestAsync<SetProfileContentPreferencesRequest>(context);
            if (request.Error != null)
                return request.Error;

            var currentUser = AuthMiddleware.GetCurrentUser(context)!;
            var uuid = Guid.Parse(currentUser.UserId);
            var isRegistered = await _User.CheckUserIsRegisteredInternalAsync(new UserInfoRequest() { TargetUserId = currentUser.UserId });
            if (isRegistered.Result)
                return Results.Unauthorized();

            var profile = await GetOrCreateOnlyDefaultProfile(uuid);
            if (profile == null || !profile.IsDefault)
                return BadRequest();

            var batch = await _Db.CreateBatchAsync();
            _Db.AddBatchCommand(batch, $"DELETE FROM {_Db.GetTableName<ContentProfileCategory>()} WHERE content_profile = @profile_id",
                ("profile_id", profile.ID));

            foreach (var category in request.Result!.Preferences)
            {
                await _Db.BatchInsertAsync<ContentProfileCategory, (Guid, Guid)>(batch, new ContentProfileCategory()
                {
                    ID = (profile.ID, category.ContentId),
                    Weight = category.Weight
                }, false, conflictHandling: DbConflictHandling.UpdateExisting);
            }
            await batch.ExecuteNonQueryAsync();

            return Results.Ok();
        }
        [Auth(false, true)]
        public async Task<IResult> GetDefaultPreferedCategories(HttpContext context, int limit = 32, int offset = 0)
        {
            var request = await RequestAsync<SetProfileContentPreferencesRequest>(context);
            if (request.Error != null)
                return request.Error;

            var currentUser = AuthMiddleware.GetCurrentUser(context)!;
            var uuid = Guid.Parse(currentUser.UserId);
            var isRegistered = await _User.CheckUserIsRegisteredInternalAsync(new UserInfoRequest() { TargetUserId = currentUser.UserId });
            if (isRegistered.Result)
                return Results.Unauthorized();

            var profile = await GetOrCreateOnlyDefaultProfile(uuid);
            if (profile == null || !profile.IsDefault)
                return BadRequest();

            var categories = _Db.GetMultipleWhen<ContentProfileCategory, (Guid, Guid)>("profile_id = @profile_id LIMIT @limit OFFSET @offset", null,
                ("profile_id", profile.ID),
                ("limit", limit),
                ("offset", offset));

            return Results.Ok();
        }

        [Auth(false, true)]
        public async Task<IResult> GetDefaultRecommendedInterests(HttpContext context, int limit = 32, int offset = 0)
        {
            var currentUser = AuthMiddleware.GetCurrentUser(context)!;
            var uuid = Guid.Parse(currentUser.UserId);

            var profile = await GetOrCreateOnlyDefaultProfile(uuid);
            if (profile == null || !profile.IsDefault)
                return BadRequest();

            var categories = _Db.GetMultiple<Interest, Guid>(SQLCommands.ContentProfiles.RecommendedInterests, null,
                ("content_profile_id", profile.ID),
                ("limit", limit),
                ("offset", offset));

            return Response(categories.ToBlockingEnumerable());
        }
        [Auth(false, true)]
        public async Task<IResult> SetDefaultPreferedInterests(HttpContext context)
        {
            var request = await RequestAsync<SetProfileContentPreferencesRequest>(context);
            if (request.Error != null)
                return request.Error;

            var currentUser = AuthMiddleware.GetCurrentUser(context)!;
            var uuid = Guid.Parse(currentUser.UserId);

            var isRegistered = await _User.CheckUserIsRegisteredInternalAsync(new UserInfoRequest() { TargetUserId = currentUser.UserId });
            if (isRegistered.Result)
                return Results.Unauthorized();

            var profile = await GetOrCreateOnlyDefaultProfile(uuid);
            if (profile == null || !profile.IsDefault)
                return BadRequest();

            var batch = await _Db.CreateBatchAsync();
            _Db.AddBatchCommand(batch, $"DELETE FROM {_Db.GetTableName<ContentProfileInterest>()} WHERE content_profile = @profile_id",
                ("profile_id", profile.ID));

            foreach (var interest in request.Result!.Preferences)
            {
                await _Db.BatchInsertAsync<ContentProfileInterest, (Guid, Guid)>(batch, new ContentProfileInterest()
                {
                    ID = (profile.ID, interest.ContentId),
                    Weight = interest.Weight
                }, false, conflictHandling: DbConflictHandling.UpdateExisting);
            }
            await batch.ExecuteNonQueryAsync();

            return Results.Ok();
        }
        [Auth(false, true)]
        public async Task<IResult> GetDefaultPreferedInterests(HttpContext context, int limit = 32, int offset = 0)
        {
            var request = await RequestAsync<SetProfileContentPreferencesRequest>(context);
            if (request.Error != null)
                return request.Error;

            var currentUser = AuthMiddleware.GetCurrentUser(context)!;
            var uuid = Guid.Parse(currentUser.UserId);
            var isRegistered = await _User.CheckUserIsRegisteredInternalAsync(new UserInfoRequest() { TargetUserId = currentUser.UserId });
            if (isRegistered.Result)
                return Results.Unauthorized();

            var profile = await GetOrCreateOnlyDefaultProfile(uuid);
            if (profile == null || !profile.IsDefault)
                return BadRequest();

            var categories = _Db.GetMultipleWhen<ContentProfileInterest, (Guid, Guid)>("profile_id = @profile_id LIMIT @limit OFFSET @offset", null,
                ("profile_id", profile.ID),
                ("limit", limit),
                ("offset", offset));

            return Results.Ok();
        }
        #endregion

        private Guid? DecodeProfileName(string profileId)
        {
            var decoded = Encoding.UTF8.GetString(UrlBase64.Decode(profileId));
            if (Guid.TryParse(decoded, out Guid result))
                return result;

            return null;
        }

        /// <summary>
        /// Fetches all content profile, but only if is it a default profile it's gonna create it
        /// </summary>
        /// <returns></returns>
        private async Task<UserContentProfile?> GetOrCreateDefaultProfile(Guid userId, Guid profileId)
        {
            var foundProfile = await _Db.GetWhen<UserContentProfile, Guid>("owner_uuid = @user_id AND id = @id", null,
                ("user_id", userId),
                ("id", profileId));

            var defaultProfileExists = await _Db.GetSingleValue(SQLCommands.ContentProfiles.CheckDefaultExists, reader => reader.GetBoolean(0),
                ("user_id", userId));

            if (foundProfile == null && !defaultProfileExists)
            {
                foundProfile = await new UserContentProfile()
                {
                    ID = Guid.NewGuid(),
                    Name = Constants.Content.ContentProfiles.DefaultContentProfileName,
                    Description = "Your default content profile",
                    IsDefault = true,
                    Owner = userId,
                    Visibility = Socigy.Structures.Enums.ContentProfileVisibility.Private
                }.TryInsertAsync<UserContentProfile, Guid>(_Db, false);
            }

            return foundProfile;
        }
        private async Task<UserContentProfile> GetOrCreateOnlyDefaultProfile(Guid userId)
        {
            var foundProfile = await _Db.GetWhen<UserContentProfile, Guid>("owner_uuid = @user_id AND is_default = TRUE", null,
                ("user_id", userId));

            foundProfile ??= await new UserContentProfile()
            {
                ID = Guid.NewGuid(),
                Name = Constants.Content.ContentProfiles.DefaultContentProfileName,
                Description = "Your default content profile",
                IsDefault = true,
                Owner = userId,
                Visibility = Socigy.Structures.Enums.ContentProfileVisibility.Private
            }.TryInsertAsync<UserContentProfile, Guid>(_Db, false);

            return foundProfile!;
        }

        public override void MapRoutes(IEndpointRouteBuilder routeBuilder)
        {
            routeBuilder.MapGet("/categories/popular", (Delegate)GetPopularCategories);

            routeBuilder.MapPost("/register/categories", (Delegate)SetDefaultPreferedCategories);
            routeBuilder.MapGet("/register/categories", (Delegate)GetDefaultPreferedCategories);
            routeBuilder.MapPost("/register/interests", (Delegate)SetDefaultPreferedInterests);
            routeBuilder.MapGet("/register/interests", (Delegate)GetDefaultPreferedInterests);
            routeBuilder.MapGet("/register/interests/recommend", (Delegate)GetDefaultRecommendedInterests);

            var intGroup = routeBuilder.MapGroup("/interests");
            intGroup.MapGet("/popular", (Delegate)GetPopularInterests);
            intGroup.MapGet("/recommend/{profileId}", (Delegate)GetRecommendedInterests);

            var group = routeBuilder.MapGroup("/profiles");
            group.MapPut("/create", (Delegate)CreateContentProfile);
            group.MapDelete("/delete", (Delegate)DeleteContentProfile);
            group.MapPatch("/edit", (Delegate)EditContentProfile);

            group.MapGet("/{profileId}/categories", (Delegate)GetPreferedCategories);
            group.MapGet("/{profileId}/interests", (Delegate)GetPreferedInterests);
            group.MapPatch("/{profileId}/categories", (Delegate)UpdatePreferedCategories);
            group.MapPatch("/{profileId}/interests", (Delegate)UpdatePreferedInterests);
            group.MapPost("/{profileId}/categories", (Delegate)SetPreferedCategories);
            group.MapPost("/{profileId}/interests", (Delegate)SetPreferedInterests);
            group.MapDelete("/{profileId}/categories", (Delegate)DeletePreferedCategories);
            group.MapDelete("/{profileId}/interests", (Delegate)DeletePreferedInterests);
        }
    }
}