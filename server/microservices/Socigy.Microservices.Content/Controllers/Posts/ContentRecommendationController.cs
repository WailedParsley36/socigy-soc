using NpgsqlTypes;
using Org.BouncyCastle.Utilities.Encoders;
using Socigy.Connectors.User.Info;
using Socigy.Microservices.Content.Requests.Content;
using Socigy.Microservices.Content.Responses;
using Socigy.Microservices.Content.Structures;
using Socigy.Microservices.Content.Structures.Posts.Queries;
using Socigy.Microservices.Content.Structures.Profiles;
using Socigy.Middlewares;
using Socigy.Middlewares.Attributes;
using Socigy.Services.Communication;
using Socigy.Services.Database;
using System.Data;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization.Metadata;

namespace Socigy.Microservices.Content.Controllers.Posts
{
    [Auth]
    public class ContentRecommendationController : BaseApiController
    {
        private readonly IDatabaseService _Db;
        private readonly UserInfoGrpcService.UserInfoGrpcServiceClient _User;
        private readonly ILogger<ContentRecommendationController> _Logger;
        public ContentRecommendationController(IJsonTypeInfoResolver jsonTypeInfoResolver, IDatabaseService db, UserInfoGrpcService.UserInfoGrpcServiceClient user, ILogger<ContentRecommendationController> logger) : base(jsonTypeInfoResolver)
        {
            _Db = db;
            _User = user;
            _Logger = logger;
        }

        public async Task<IResult> GetRecommendations(HttpContext context)
        {
            var currentUser = AuthMiddleware.GetCurrentUser(context)!;
            var userId = Guid.Parse(currentUser.UserId);

            var request = await GetFromBodyAsync<RecommendationRequest>(context);
            if (request == null)
                return BadRequest();
            if (!request.ContentProfile.HasValue)
            {
                var defaultProfile = await _Db.GetWhen<UserContentProfile, Guid>("owner_uuid = @user_id AND is_default = TRUE", null,
                    ("user_id", userId));
                if (defaultProfile == null)
                    return BadRequest(); // This should not happen...

                request.ContentProfile = defaultProfile.ID;
            }

            var blockedIds = await _User.GetUsersBlockedTargetIdsInternalAsync(new UserInfoRequest() { TargetUserId = currentUser.UserId });
            var posts = _Db.GetMultipleNullable<RecommendedPost, Guid>(SQLCommands.Posts.Recommend, null,
                ("blocked_ids", blockedIds?.Ids.Select(x => Guid.Parse(x)).ToArray(), NpgsqlDbType.Uuid | NpgsqlDbType.Array),
                ("user_content_profile", request.ContentProfile.Value, NpgsqlDbType.Uuid),
                ("current_user_id", userId, NpgsqlDbType.Uuid),
                ("creator_ids", request.CreatorIds, NpgsqlDbType.Uuid | NpgsqlDbType.Array),
                ("category_ids", request.CategoryIds, NpgsqlDbType.Uuid | NpgsqlDbType.Array),
                ("interest_ids", request.InterestIds, NpgsqlDbType.Uuid | NpgsqlDbType.Array),
                ("excluded_creator_ids", request.ExcludedCreatorIds, NpgsqlDbType.Uuid | NpgsqlDbType.Array),
                ("excluded_category_ids", request.ExcludedCategoryIds, NpgsqlDbType.Uuid | NpgsqlDbType.Array),
                ("excluded_interest_ids", request.ExcludedInterestIds, NpgsqlDbType.Uuid | NpgsqlDbType.Array),
                ("content_types", request.ContentTypes?.Select(x => (short)x), NpgsqlDbType.Smallint | NpgsqlDbType.Array),
                ("posted_after", request.PostedAfter, NpgsqlDbType.Timestamp),
                ("posted_before", request.PostedBefore, NpgsqlDbType.Timestamp),
                ("limit", request.Limit, NpgsqlDbType.Integer),
                ("comment_limit", 10, NpgsqlDbType.Integer),
                ("offset", request.Offset, NpgsqlDbType.Integer));

            var response = new PostRecommendationResponse();

            var aggregatedUsers = new List<Guid>();
            List<RecommendedPost> postList = [];
            await foreach (var x in posts)
            {
                postList.Add(x);

                if (!string.IsNullOrEmpty(x.CommentsJson))
                    x.Comments = JsonSerializer.Deserialize(x.CommentsJson, StructuresJsonContext.Default.IEnumerableRecommendedPostComment);
                if (!string.IsNullOrEmpty(x.MediaJson))
                    x.Media = JsonSerializer.Deserialize(x.MediaJson, StructuresJsonContext.Default.IEnumerableRecommendedPostMedia);
                if (!string.IsNullOrEmpty(x.UserJson))
                {
                    var users = JsonSerializer.Deserialize(x.UserJson, StructuresJsonContext.Default.IEnumerableJsonUserInfo);
                    if (users != null)
                        aggregatedUsers.AddRange(users.Select(x => x.UserId));
                }

                x.MediaJson = null!;
                x.CommentsJson = null!;
                x.UserJson = null!;
            }
            response.Posts = postList;

            var batchRequest = new UserCircleVerificationRequest();
            batchRequest.Ids.AddRange(aggregatedUsers.Select(x => x.ToString()));
            var user = _User.GetUserInfoBatchInternal(batchRequest);
            var dictUsers = new Dictionary<Guid, UserShallowInfo>();
            while (await user.ResponseStream.MoveNext(CancellationToken.None))
            {
                var current = user.ResponseStream.Current;
                if (current == null)
                    continue;

                dictUsers[Guid.Parse(current.Id)] = new UserShallowInfo()
                {
                    Username = current.Username,
                    Tag = (short)current.Tag,
                    IconUrl = current.IconUrl
                };
            }

            response.Users = dictUsers;
            return Response(response);
        }
        public async Task<IResult> QueryPosts(HttpContext context)
        {
            var currentUser = AuthMiddleware.GetCurrentUser(context)!;
            var userId = Guid.Parse(currentUser.UserId);

            var request = await GetFromBodyAsync<RecommendationRequest>(context);
            if (request == null)
                return BadRequest();

            // LOW - Let the users select how will the posts order. Currently 'p.created_at DESC'
            var posts = _Db.GetMultipleNullable<RecommendedPost, Guid>(SQLCommands.Posts.Query, null,
                ("target_user_id", request.TargetUserId, NpgsqlDbType.Uuid),
                ("search_string", request.Search, NpgsqlDbType.Varchar),
                ("creator_ids", request.CreatorIds, NpgsqlDbType.Uuid | NpgsqlDbType.Array),
                ("category_ids", request.CategoryIds, NpgsqlDbType.Uuid | NpgsqlDbType.Array),
                ("interest_ids", request.InterestIds, NpgsqlDbType.Uuid | NpgsqlDbType.Array),
                ("excluded_creator_ids", request.ExcludedCreatorIds, NpgsqlDbType.Uuid | NpgsqlDbType.Array),
                ("excluded_category_ids", request.ExcludedCategoryIds, NpgsqlDbType.Uuid | NpgsqlDbType.Array),
                ("excluded_interest_ids", request.ExcludedInterestIds, NpgsqlDbType.Uuid | NpgsqlDbType.Array),
                ("content_types", request.ContentTypes?.Select(x => (short)x), NpgsqlDbType.Smallint | NpgsqlDbType.Array),
                ("posted_after", request.PostedAfter, NpgsqlDbType.Timestamp),
                ("posted_before", request.PostedBefore, NpgsqlDbType.Timestamp),
                ("limit", request.Limit, NpgsqlDbType.Integer),
                ("offset", request.Offset, NpgsqlDbType.Integer));

            return Response(posts.ToBlockingEnumerable());
        }

        public override void MapRoutes(IEndpointRouteBuilder routeBuilder)
        {
            routeBuilder.MapPost("/recommend", (Delegate)GetRecommendations);
            routeBuilder.MapPost("/query", (Delegate)QueryPosts);
        }
    }
}