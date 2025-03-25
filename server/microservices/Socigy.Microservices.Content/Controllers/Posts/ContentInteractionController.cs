using Org.BouncyCastle.Utilities.Encoders;
using Socigy.Microservices.Content.Enums;
using Socigy.Microservices.Content.Requests.Content;
using Socigy.Microservices.Content.Requests.Content.Polls;
using Socigy.Microservices.Content.Structures;
using Socigy.Microservices.Content.Structures.Posts;
using Socigy.Microservices.Content.Structures.Posts.Interactions;
using Socigy.Microservices.Content.Structures.Posts.Polls;
using Socigy.Middlewares;
using Socigy.Middlewares.Attributes;
using Socigy.Services.Communication;
using Socigy.Services.Database;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization.Metadata;

namespace Socigy.Microservices.Content.Controllers.Posts
{
    [Auth]
    public class ContentInteractionController : BaseApiController
    {
        private readonly IDatabaseService _Db;
        public ContentInteractionController(IJsonTypeInfoResolver jsonTypeInfoResolver, IDatabaseService db) : base(jsonTypeInfoResolver)
        {
            _Db = db;
        }

        #region Normal
        public async Task<IResult> AddInteraction(HttpContext context)
        {
            var currentUser = AuthMiddleware.GetCurrentUser(context)!;
            var userId = Guid.Parse(currentUser.UserId);

            var interactionRequest = await GetFromBodyAsync<InteractionRequest>(context);
            if (interactionRequest == null)
                return BadRequest("Invalid interaction request.");

            // LOW/MEDIUM - SignalR Hub for Views and block View adding for AddInteraction

            var postExists = (await _Db.GetByIdAsync<Post, Guid>(interactionRequest.PostId)).Value;
            if (postExists == null)
                return Results.NotFound("Post not found.");

            // Handle existing interactions
            var existingInteraction = await _Db.GetWhen<PostInteraction, Guid>(
                "post_id = @post_id AND user_id = @user_id AND interaction_type = @type",
                null,
                ("post_id", interactionRequest.PostId),
                ("user_id", userId),
                ("type", (short)interactionRequest.Type)
            );

            if (interactionRequest.Type == InteractionType.View)
            {
                if (existingInteraction != null)
                {
                    existingInteraction.CreatedAt = DateTime.UtcNow;
                    if (interactionRequest.ViewSeconds.HasValue)
                        existingInteraction.ViewSeconds = interactionRequest.ViewSeconds;

                    await existingInteraction.UpdateAsync<PostInteraction, Guid>(
                        _Db,
                        null,
                        nameof(PostInteraction.CreatedAt),
                        nameof(PostInteraction.ViewSeconds)
                    );
                    return Results.Ok();
                }
            }

            if (interactionRequest.Type == InteractionType.Like || interactionRequest.Type == InteractionType.Dislike)
            {
                var oppositeType = interactionRequest.Type == InteractionType.Like
                    ? InteractionType.Dislike
                    : InteractionType.Like;

                var oppositeInteraction = await _Db.GetWhen<PostInteraction, Guid>(
                    "post_id = @post_id AND user_id = @user_id AND interaction_type = @type",
                    null,
                    ("post_id", interactionRequest.PostId),
                    ("user_id", userId),
                    ("type", (short)oppositeType)
                );

                if (oppositeInteraction != null)
                    await _Db.DeleteByIdAsync<PostInteraction, Guid>(oppositeInteraction);

                if (existingInteraction != null)
                    return Results.Ok();
            }

            var interaction = new PostInteraction
            {
                ID = Guid.NewGuid(),
                PostId = interactionRequest.PostId,
                UserId = userId,
                InteractionType = interactionRequest.Type,
                ViewSeconds = interactionRequest.Type == InteractionType.View ? interactionRequest.ViewSeconds : null,
                CreatedAt = DateTime.UtcNow
            };

            var result = await interaction.TryInsertAsync<PostInteraction, Guid>(_Db, false);
            if (result == null)
                return Unexpected();

            return Results.Ok();
        }
        public async Task<IResult> RemoveInteraction(HttpContext context)
        {
            var currentUser = AuthMiddleware.GetCurrentUser(context)!;
            var userId = Guid.Parse(currentUser.UserId);

            var interactionRequest = await GetFromBodyAsync<InteractionRequest>(context);
            if (interactionRequest == null && (interactionRequest.Type != InteractionType.Like || interactionRequest.Type != InteractionType.Dislike || interactionRequest.Type != InteractionType.Report))
                return BadRequest("Invalid interaction request.");

            var foundInteraction = await _Db.GetWhen<PostInteraction, Guid>("user_id = @user_id AND post_id = @post_id AND interaction_type = @type", null,
                ("type", (short)interactionRequest.Type),
                ("post_id", interactionRequest.PostId),
                ("user_id", userId));
            if (foundInteraction == null)
                return Results.Ok();

            await foundInteraction.TryDeleteAsync<PostInteraction, Guid>(_Db);

            return Results.Ok();
        }
        #endregion

        #region Comments
        public async Task<IResult> GetComments(HttpContext context, string postId, bool nested = false, int limit = 15, int offset = 0)
        {
            var currentUser = AuthMiddleware.GetCurrentUser(context)!;
            var userId = Guid.Parse(currentUser.UserId);

            var decodedPostId = DecodeParameter(postId);
            if (!Guid.TryParse(postId, out Guid postGuid))
                return BadRequest();

            var comments = _Db.GetMultipleWhen<Comment, Guid>($"post_id = @post_id AND parent_comment_id {(nested ? "NOT NULL" : "= NULL")} LIMIT @limit OFFSET @offset", null,
                ("limit", limit),
                ("offset", offset),
                ("post_id", postGuid));

            return Response(comments.ToBlockingEnumerable());
        }
        public async Task<IResult> GetCommentComments(HttpContext context, string postId, string commentId, bool nested = false, int limit = 15, int offset = 0)
        {
            var currentUser = AuthMiddleware.GetCurrentUser(context)!;
            var userId = Guid.Parse(currentUser.UserId);

            var decodedPostId = DecodeParameter(postId);
            if (!Guid.TryParse(postId, out Guid postGuid))
                return BadRequest();

            var decodedCommentId = DecodeParameter(postId);
            if (!Guid.TryParse(postId, out Guid commentGuid))
                return BadRequest();

            var comments = _Db.GetMultipleWhen<Comment, Guid>($"post_id = @post_id AND parent_comment_id = @comment_id LIMIT @limit OFFSET @offset", null,
                ("limit", limit),
                ("offset", offset),
                ("post_id", postGuid),
                ("comment_id", commentGuid));

            return Response(comments.ToBlockingEnumerable());
        }

        public async Task<IResult> AddComment(HttpContext context)
        {
            var currentUser = AuthMiddleware.GetCurrentUser(context)!;
            var userId = Guid.Parse(currentUser.UserId);

            var commentRequest = await GetFromBodyAsync<CommentRequest>(context);
            if (commentRequest == null || string.IsNullOrEmpty(commentRequest.Content) || commentRequest.PostId == Guid.Empty)
                return BadRequest("Invalid comment request.");

            var comment = await new Comment
            {
                ID = Guid.NewGuid(),
                PostId = commentRequest.PostId,
                UserId = userId,
                Content = commentRequest.Content,
                ParentCommentId = commentRequest.ParentCommentId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }.TryInsertAsync<Comment, Guid>(_Db, false);
            if (comment == null)
                return Unexpected();

            var alreadyCommented = await _Db.GetWhen<PostInteraction, Guid>("user_id = @user_id AND post_id = @post_id AND interaction_type = @type", null,
                ("type", (short)InteractionType.Comment),
                ("post_id", commentRequest.PostId),
                ("user_id", userId));
            if (alreadyCommented == null)
            {
                await new PostInteraction
                {
                    ID = Guid.NewGuid(),
                    PostId = commentRequest.PostId,
                    UserId = userId,
                    InteractionType = Enums.InteractionType.Comment,
                    CreatedAt = DateTime.UtcNow
                }.TryInsertAsync<PostInteraction, Guid>(_Db, false);
            }


            return Response(comment);
        }
        #endregion

        #region Polls
        public async Task<IResult> DeleteVote(HttpContext context)
        {
            var currentUser = AuthMiddleware.GetCurrentUser(context)!;
            var userId = Guid.Parse(currentUser.UserId);

            var voteRequest = await GetFromBodyAsync<VoteRequest>(context);
            if (voteRequest == null)
                return BadRequest();

            await _Db.ExecuteNonQueryAsync(SQLCommands.Posts.Polls.RemoveUserVotes, null,
                ("post_id", voteRequest.PollId),
                ("user_id", userId));

            return Results.Ok();
        }
        public async Task<IResult> VotePoll(HttpContext context)
        {
            var currentUser = AuthMiddleware.GetCurrentUser(context)!;
            var userId = Guid.Parse(currentUser.UserId);

            var voteRequest = await GetFromBodyAsync<VoteRequest>(context);
            if (voteRequest == null || voteRequest.PollOptionIds == null || !voteRequest.PollOptionIds.Any())
                return BadRequest();

            var poll = (await _Db.GetByIdAsync<Post, Guid>(voteRequest.PollId)).Value;
            if (poll == null)
                return Results.NotFound();

            bool multipleVotes = false;
            if (poll.Metadata != null)
            {
                var pollMetadata = JsonSerializer.Deserialize(poll.Metadata, StructuresJsonContext.Default.PollMetadata);
                if (pollMetadata != null)
                    multipleVotes = pollMetadata.MultipleVotes;
            }

            if (!multipleVotes)
            {
                if (voteRequest.PollOptionIds.Count() > 1)
                    return BadRequest();

                var userHasVoted = await _Db.GetSingleValue(SQLCommands.Posts.Polls.CheckUserHasVoted, reader => reader.GetBoolean(0),
                    ("post_id", voteRequest.PollId),
                    ("user_id", userId));
                if (userHasVoted)
                    return BadRequest();
            }

            // OPTIMAL - All poll options can be fetched at once...
            var batch = await _Db.CreateBatchAsync();
            foreach (var optionId in voteRequest.PollOptionIds)
            {
                var pollOption = (await _Db.GetByIdAsync<PollOption, Guid>(optionId)).Value;
                if (pollOption == null)
                    continue;

                var vote = new PollVote
                {
                    ID = (optionId, userId),
                    CreatedAt = DateTime.UtcNow
                };
                await _Db.BatchInsertAsync<PollVote, (Guid, Guid)>(batch, vote, false, Socigy.Services.Database.Enums.DbConflictHandling.DoNothing);
            }
            await batch.ExecuteNonQueryAsync();

            return Results.Ok();
        }
        #endregion

        private string DecodeParameter(string profileName)
        {
            return Encoding.UTF8.GetString(UrlBase64.Decode(profileName));
        }

        public override void MapRoutes(IEndpointRouteBuilder routeBuilder)
        {
            var group = routeBuilder.MapGroup("/interactions");
            group.MapPost("/add", (Delegate)AddInteraction);
            group.MapDelete("/remove", (Delegate)RemoveInteraction);

            // LOW - Edit comment - Editation history
            //group.MapDelete("/comment", (Delegate)DeleteComment);
            // LOW - Delete comment - Deletion history
            //group.MapDelete("/comment", (Delegate)EditComment);
            group.MapPost("/comment", (Delegate)AddComment);

            group.MapPost("/vote", (Delegate)VotePoll);
            group.MapDelete("/vote", (Delegate)DeleteVote);

            group.MapGet("/comments/{postId}", (Delegate)GetComments);
            group.MapGet("/comments/{postId}/{commentId}", (Delegate)GetCommentComments);
        }
    }
}
