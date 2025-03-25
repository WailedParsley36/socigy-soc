using Microsoft.AspNetCore.Mvc;
using Socigy.Connectors.User.Info;
using Socigy.Microservices.Content.Enums;
using Socigy.Microservices.Content.Requests.Content;
using Socigy.Microservices.Content.Responses;
using Socigy.Microservices.Content.Services;
using Socigy.Microservices.Content.Structures;
using Socigy.Microservices.Content.Structures.Categorization;
using Socigy.Microservices.Content.Structures.Posts;
using Socigy.Microservices.Content.Structures.Posts.Polls;
using Socigy.Microservices.Content.Structures.Posts.Scheduling;
using Socigy.Microservices.Content.Structures.Uploads;
using Socigy.Middlewares;
using Socigy.Middlewares.Attributes;
using Socigy.Services.Communication;
using Socigy.Services.Database;
using System.Data;
using System.Data.Common;
using System.Text.Json;
using System.Text.Json.Serialization.Metadata;

namespace Socigy.Microservices.Content.Controllers.Posts
{
    [Auth]
    public class ContentUploadController : BaseApiController
    {
        private static readonly string[] _VideoExtensions = [".mp4", ".webm", ".mov", ".avi", ".mkv"];
        private static readonly string[] _ImageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg"];
        private static readonly string[] _AudioExtensions = [".mp3", ".wav", ".ogg", ".aac", ".flac"];

        private readonly IDatabaseService _Db;
        private readonly IStorageService _Storage;
        private readonly UserInfoGrpcService.UserInfoGrpcServiceClient _User;

        private readonly ILogger<ContentUploadController> _Logger;
        public ContentUploadController(ILogger<ContentUploadController> logger, IJsonTypeInfoResolver jsonTypeInfoResolver, IDatabaseService db, IStorageService storage, UserInfoGrpcService.UserInfoGrpcServiceClient user) : base(jsonTypeInfoResolver)
        {
            _Db = db;
            _Storage = storage;
            _User = user;
            _Logger = logger;
        }

        public async Task<IResult> UploadPostData(HttpContext context)
        {
            if (!context.Request.HasFormContentType)
                return BadRequest();

            CreatePostRequest request;
            try
            {
                request = CreatePostRequestExtensions.ParseFormRequest(context);
            }
            catch (Exception ex)
            {
                _Logger.LogError("Failed to parse the form request");
                return BadRequest();
            }

            if (!await request.IsValid(_Db))
            {
                _Logger.LogError("Request is not valid...");
                return BadRequest();
            }

            var currentUser = AuthMiddleware.GetCurrentUser(context)!;
            var userId = Guid.Parse(currentUser.UserId);

            // MEDIUM -> Debug if transactions work with PostgreSQL as I fear they not...
            using var transaction = await _Db.CreateTransactionAsync();

            var postId = Guid.NewGuid();
            var post = await new Post
            {
                ID = postId,
                UserId = userId,
                ContentType = request.ContentType,
                Title = request.Title,
                Content = request.Content,
                ExternalUrl = request.ExternalUrl,
                Visibility = request.Visibility,
                IsScheduled = request.IsScheduled,
                ScheduledFor = request.ScheduledFor,
                IsDraft = request.IsDraft,
                Metadata = request.Metadata != null ? JsonSerializer.Serialize(request.Metadata, StructuresJsonContext.Default.JsonDocument) : null,
                IsRecurring = request.IsRecurring,
                PublishStatus = request.IsDraft ? PublishStatus.Draft :
                                request.IsScheduled ? PublishStatus.Scheduled :
                                PublishStatus.Published,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }.TryInsertAsync<Post, Guid>(_Db, false, transaction);
            if (post == null)
                return Unexpected();

            if (request.Files != null && request.Files.Count > 0)
            {
                var result = await ProcessFileUploads(request.Files, postId, post.ContentType, transaction);
                if (result != null)
                    return result;
            }

            if (request.Collaborators != null && request.Collaborators.Count > 0)
            {
                await ProcessCollaborators(request.Collaborators, postId, transaction);
            }

            if (request.Locations != null && request.Locations.Count > 0)
            {
                await ProcessLocations(request.Locations, postId, transaction);
            }

            if (request.InterestIds != null && request.InterestIds.Count > 0)
            {
                await ProcessInterests(request.InterestIds, postId, transaction);
            }

            if (request.Visibility == VisibilityType.CustomCircles &&
                request.CircleIds != null && request.CircleIds.Count > 0)
            {
                await ProcessCircles(request.CircleIds, postId, transaction);
            }

            await ProcessContentTypeSpecific(request, postId, transaction);

            if (request.IsScheduled && request.ScheduledFor.HasValue)
            {
                await ProcessScheduling(request, userId, postId, transaction);
            }

            await transaction.CommitAsync();

            return Response(new CreatePostResponse { PostId = postId });
        }

        [Auth(Ignore = true)]
        public async Task<IResult> Test(HttpContext context)
        {
            var form = await context.Request.ReadFormAsync();
            await using var trans = await _Db.CreateTransactionAsync();
            await ProcessFileUploads([.. form.Files], Guid.NewGuid(), ContentType.Frame, trans);

            return Results.Ok();
        }

        #region Files
        private async Task<IResult?> ProcessFileUploads(List<IFormFile> files, Guid postId, ContentType type, DbTransaction transaction)
        {
            int position = 0;
            foreach (var file in files)
            {
                var (mediaType, isFileSizeOk) = DetermineMediaType(file);
                if (!isFileSizeOk)
                    return BadRequest();

                var (url, thumbnailUrl) = await _Storage.UploadFileAsync(file.OpenReadStream(), Convert.ToBase64String(postId.ToByteArray()), Path.GetExtension(file.FileName), type, mediaType);

                var attachment = new MediaAttachment
                {
                    ID = Guid.NewGuid(),
                    PostId = postId,
                    MediaType = mediaType,
                    Url = url,
                    ThumbnailUrl = thumbnailUrl,
                    Position = position++,
                    // LOW: JSONB metadata insertion
                    //Metadata = JsonSerializer.Serialize(new FileMetadata
                    //{
                    //    FileName = file.FileName,
                    //    Type = type,
                    //    FileSize = file.Length
                    //}, JsonResolver.GetTypeInfo(typeof(FileMetadata), _SerializerOptions)!),
                    CreatedAt = DateTime.UtcNow
                };

                await _Db.InsertAsync<MediaAttachment, Guid>(attachment, false, transaction: transaction);
            }

            return null;
        }
        private (MediaType Type, bool IsSizeOk) DetermineMediaType(IFormFile file)
        {
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();

            if (_ImageExtensions.Contains(extension))
                return (MediaType.Image, file.Length < ContentConstants.Posts.MaxImageSize);

            if (_VideoExtensions.Contains(extension))
                return (MediaType.Video, file.Length < ContentConstants.Posts.MaxVideoSize);

            if (_AudioExtensions.Contains(extension))
                return (MediaType.Audio, file.Length < ContentConstants.Posts.MaxAudioSize);

            return (MediaType.Other, file.Length < ContentConstants.Posts.MaxImageSize);
        }
        #endregion

        #region Collaborators
        private async Task ProcessCollaborators(List<CollaboratorRequest> collaborators, Guid postId, DbTransaction transaction)
        {
            foreach (var collaborator in collaborators)
            {
                var postCollaborator = new PostCollaborator
                {
                    ID = (postId, collaborator.UserId, collaborator.Role),
                    Position = collaborator.Position,
                    CreatedAt = DateTime.UtcNow
                };

                await _Db.InsertAsync<PostCollaborator, (Guid, Guid, CollaborationRole)>(
                    postCollaborator, false, transaction: transaction);
            }
        }
        #endregion

        #region Locations
        private async Task ProcessLocations(List<LocationRequest> locations, Guid postId, DbTransaction transaction)
        {
            foreach (var location in locations)
            {
                var existingLocation = await _Db.GetWhen<Location, Guid>(
                    "name = @name AND latitude = @latitude AND longitude = @longitude",
                    transaction,
                    ("name", location.Name),
                    ("latitude", location.Latitude),
                    ("longitude", location.Longitude));

                var locationId = existingLocation?.ID ?? Guid.NewGuid();

                if (existingLocation == null)
                {
                    var newLocation = new Location
                    {
                        ID = locationId,
                        Name = location.Name,
                        Address = location.Address,
                        Latitude = location.Latitude,
                        Longitude = location.Longitude,
                        CreatedAt = DateTime.UtcNow
                    };

                    await _Db.InsertAsync<Location, Guid>(newLocation, false, transaction: transaction);
                }

                var postLocation = new PostLocation
                {
                    ID = Guid.NewGuid(),
                    PostId = postId,
                    LocationId = locationId,
                    MediaAttachmentId = location.MediaAttachmentId,
                    CreatedAt = DateTime.UtcNow
                };

                await _Db.InsertAsync<PostLocation, Guid>(postLocation, false, transaction: transaction);
            }
        }
        #endregion

        #region Interests
        private async Task ProcessInterests(List<Guid> interestIds, Guid postId, DbTransaction transaction)
        {
            foreach (var interestId in interestIds)
            {
                var postInterest = new PostInterests
                {
                    ID = (postId, interestId)
                };

                await _Db.InsertAsync<PostInterests, (Guid, Guid)>(
                    postInterest, false, transaction: transaction);
            }
        }
        #endregion

        #region Visibility
        private async Task ProcessCircles(List<Guid> circleIds, Guid postId, DbTransaction transaction)
        {
            var request = new UserCircleVerificationRequest();
            request.Ids.AddRange(circleIds.Select(x => x.ToString()));
            var result = await _User.VerifyUserCircleIdsExistsInternalAsync(request);
            if (!result.Success)
                return;

            foreach (var circleId in circleIds)
            {
                var postCircle = new PostCircle
                {
                    ID = (postId, circleId),
                    CreatedAt = DateTime.UtcNow
                };

                await _Db.InsertAsync<PostCircle, (Guid, Guid)>(
                    postCircle, false, transaction: transaction);
            }
        }
        #endregion

        #region Content Specific
        private async Task ProcessContentTypeSpecific(CreatePostRequest request, Guid postId, DbTransaction transaction)
        {
            switch (request.ContentType)
            {
                case ContentType.Poll:
                    await ProcessPoll(request, postId, transaction);
                    break;

                case ContentType.Stream:
                case ContentType.LiveTake:
                case ContentType.LivePodcast:
                    await ProcessLiveStream(request, postId, transaction);
                    break;

                case ContentType.Podcast:
                case ContentType.Music:
                    if (request.SeriesId.HasValue)
                    {
                        await ProcessSeriesEpisode(request, postId, transaction);
                    }
                    break;
            }
        }

        #region Polls
        private async Task ProcessPoll(CreatePostRequest request, Guid postId, DbTransaction transaction)
        {
            var pollId = Guid.NewGuid();
            var poll = new Poll
            {
                ID = pollId,
                PostId = postId,
                Question = request.PollQuestion!,
                CreatedAt = DateTime.UtcNow
            };

            await _Db.InsertAsync<Poll, Guid>(poll, false, transaction: transaction);

            int position = 0;
            foreach (var optionText in request.PollOptions!)
            {
                var option = new PollOption
                {
                    ID = Guid.NewGuid(),
                    PostId = postId,
                    OptionText = optionText,
                    Position = position++,
                    CreatedAt = DateTime.UtcNow
                };

                await _Db.InsertAsync<PollOption, Guid>(option, false, transaction: transaction);
            }
        }
        #endregion

        #region Live Streams
        private async Task ProcessLiveStream(CreatePostRequest request, Guid postId, DbTransaction transaction)
        {
            var streamKey = Guid.NewGuid().ToString("N");

            var liveStream = new LiveStream
            {
                ID = postId,
                StreamKey = streamKey,
                Status = LiveStreamStatus.Scheduled,
                ViewerCount = 0,
                MaxViewerCount = 0,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _Db.InsertAsync<LiveStream, Guid>(liveStream, false, transaction: transaction);

            if (request.IsRecurring && request.RecurrencePattern.HasValue)
            {
                var recurringStream = new RecurringStream
                {
                    ID = Guid.NewGuid(),
                    PostId = postId,
                    StreamKey = streamKey,
                    Platform = request.Platform ?? "custom",
                    RecurrencePattern = request.RecurrencePattern.Value,
                    RecurrenceInterval = request.RecurrenceInterval ?? 1,
                    DaysOfWeek = (int[])(request.DaysOfWeek ?? [1, 3, 5]),
                    StartDate = request.ScheduledFor?.Date ?? DateTime.UtcNow.Date,
                    EndDate = request.EndDate,
                    TimeOfDay = TimeSpan.FromHours(request.ScheduledFor?.Hour ?? 12) +
                               TimeSpan.FromMinutes(request.ScheduledFor?.Minute ?? 0),
                    EstimatedDuration = request.EstimatedDuration,
                    NextStreamAt = request.ScheduledFor,
                    Timezone = request.Timezone ?? "UTC",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                await _Db.InsertAsync<RecurringStream, Guid>(recurringStream, false, transaction: transaction);
            }
        }
        #endregion
        #endregion

        #region Series
        private async Task ProcessSeriesEpisode(CreatePostRequest request, Guid postId, DbTransaction transaction)
        {
            if (request.SeriesId.HasValue && request.EpisodeNumber.HasValue)
            {
                var seriesEpisode = new SeriesEpisode
                {
                    ID = (request.SeriesId.Value, postId),
                    EpisodeNumber = request.EpisodeNumber.Value,
                    Title = request.EpisodeTitle ?? request.Title ?? $"Episode {request.EpisodeNumber}.",
                    IsPublished = !request.IsDraft && !request.IsScheduled,
                    ScheduledFor = request.IsScheduled ? request.ScheduledFor : null,
                    PublishedAt = (!request.IsDraft && !request.IsScheduled) ? DateTime.UtcNow : null,
                    CreatedAt = DateTime.UtcNow
                };

                await _Db.InsertAsync<SeriesEpisode, (Guid, Guid)>(seriesEpisode, false, transaction: transaction);
            }
        }
        #endregion

        #region Scheduling
        private async Task ProcessScheduling(CreatePostRequest request, Guid userId, Guid postId, DbTransaction transaction)
        {
            if (request.IsSequence && request.SequenceName != null)
            {
                var sequence = await _Db.GetWhen<PostSequence, Guid>(
                    "user_id = @userId AND name = @name",
                    transaction,
                    ("userId", userId),
                    ("name", request.SequenceName));

                if (sequence == null)
                {
                    // Create new sequence
                    sequence = new PostSequence
                    {
                        ID = Guid.NewGuid(),
                        UserId = userId,
                        Name = request.SequenceName,
                        Description = request.SequenceDescription,
                        StartDate = request.ScheduledFor!.Value,
                        TimeOfDay = TimeSpan.FromHours(request.ScheduledFor.Value.Hour) +
                                   TimeSpan.FromMinutes(request.ScheduledFor.Value.Minute),
                        IntervalDays = request.IntervalDays ?? 1,
                        IsActive = true,
                        NextPublishAt = request.ScheduledFor.Value,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };

                    await _Db.InsertAsync<PostSequence, Guid>(sequence, false, transaction: transaction);
                }

                // Add post to sequence
                var position = await _Db.GetSingleValue("SELECT COALESCE(MAX(position), 0) + 1 FROM post_sequence_items WHERE sequence_id = @sequenceId",
                    reader => reader.GetInt32(0),
                    transaction,
                    ("sequenceId", sequence.ID));

                var sequenceItem = new PostSequenceItem
                {
                    ID = (sequence.ID, postId),
                    Position = position,
                    IsPublished = false,
                    PublishedAt = null
                };

                await _Db.InsertAsync<PostSequenceItem, (Guid, Guid)>(sequenceItem, false, transaction: transaction);
            }
        }
        #endregion

        public override void MapRoutes(IEndpointRouteBuilder routeBuilder)
        {
            routeBuilder.MapPost("/upload", (Delegate)UploadPostData);

            // TODO: Edit post data
            routeBuilder.MapPost("/edit", (Delegate)UploadPostData);
            routeBuilder.MapPost("/upload/debug", (Delegate)Test);
        }
    }
}
