using Microsoft.AspNetCore.SignalR;
using Socigy.Microservices.Content.Structures.Posts.Interactions;
using Socigy.Microservices.Content.Structures.Posts;
using Socigy.Middlewares.Attributes;
using Socigy.Services.Database;
using System.Text.Json.Serialization.Metadata;
using Socigy.Middlewares;
using Socigy.Microservices.Content.Enums;

namespace Socigy.Microservices.Content.Hubs
{
    [Auth]
    public class ContentHub : Hub
    {
        private readonly IDatabaseService _db;
        private readonly IJsonTypeInfoResolver _jsonResolver;

        public ContentHub(IDatabaseService db, IJsonTypeInfoResolver jsonResolver)
        {
            _db = db;
            _jsonResolver = jsonResolver;
        }

        public override async Task OnConnectedAsync()
        {
            var httpContext = Context.GetHttpContext();
            var currentUser = AuthMiddleware.GetCurrentUser(httpContext!);

            if (currentUser != null)
            {
                // Add to user's personal group
                await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{currentUser.UserId}");

                // Add to groups for posts the user is watching
                var watchedPosts = _db.GetMultipleWhen<PostInteraction, Guid>(
                    "user_id = @userId AND interaction_type = 'watch'",
                    null,
                    ("userId", Guid.Parse(currentUser.UserId))
                ).ToBlockingEnumerable();

                foreach (var post in watchedPosts)
                {
                    await Groups.AddToGroupAsync(Context.ConnectionId, $"post_{post.PostId}");
                }
            }

            await base.OnConnectedAsync();
        }

        public async Task JoinPostGroup(string postId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"post_{postId}");
        }

        public async Task LeavePostGroup(string postId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"post_{postId}");
        }

        public async Task StartWatchingLiveStream(string postId)
        {
            var httpContext = Context.GetHttpContext();
            var currentUser = AuthMiddleware.GetCurrentUser(httpContext!);

            if (currentUser != null)
            {
                var userId = Guid.Parse(currentUser.UserId);
                var post = await _db.GetWhen<Post, Guid>("id = @postId", null, ("postId", Guid.Parse(postId)));

                if (post != null && (post.ContentType == ContentType.LiveTake ||
                                    post.ContentType == ContentType.LivePodcast ||
                                    post.ContentType == ContentType.Stream))
                {
                    // Add viewer to stream
                    await _db.ExecuteNonQueryAsync(
                        "UPDATE live_streams SET viewer_count = viewer_count + 1, " +
                        "max_viewer_count = GREATEST(max_viewer_count, viewer_count + 1) " +
                        "WHERE post_id = @postId",
                        null,
                        ("postId", Guid.Parse(postId))
                    );

                    // Add to post group
                    await Groups.AddToGroupAsync(Context.ConnectionId, $"post_{postId}");

                    // Notify others about new viewer
                    await Clients.Group($"post_{postId}").SendAsync("ViewerJoined", new
                    {
                        PostId = postId,
                        UserId = userId
                    });
                }
            }
        }

        public async Task StopWatchingLiveStream(string postId)
        {
            var httpContext = Context.GetHttpContext();
            var currentUser = AuthMiddleware.GetCurrentUser(httpContext!);

            if (currentUser != null)
            {
                var userId = Guid.Parse(currentUser.UserId);

                // Decrease viewer count
                await _db.ExecuteNonQueryAsync(
                    "UPDATE live_streams SET viewer_count = GREATEST(0, viewer_count - 1) WHERE post_id = @postId",
                    null,
                    ("postId", Guid.Parse(postId))
                );

                // Remove from post group
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"post_{postId}");

                // Notify others about viewer leaving
                await Clients.Group($"post_{postId}").SendAsync("ViewerLeft", new
                {
                    PostId = postId,
                    UserId = userId
                });
            }
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var httpContext = Context.GetHttpContext();
            var currentUser = AuthMiddleware.GetCurrentUser(httpContext!);

            if (currentUser != null)
            {
                // Update viewer counts for any live streams the user was watching
                await _db.ExecuteNonQueryAsync(
                    @"UPDATE live_streams 
                      SET viewer_count = GREATEST(0, viewer_count - 1) 
                      WHERE post_id IN (
                          SELECT post_id FROM post_interactions 
                          WHERE user_id = @userId AND interaction_type = 'watch'
                      )",
                    null,
                    ("userId", Guid.Parse(currentUser.UserId))
                );
            }

            await base.OnDisconnectedAsync(exception);
        }
    }
}
