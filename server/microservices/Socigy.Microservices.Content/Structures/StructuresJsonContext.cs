using Socigy.Connectors.User.Info;
using Socigy.Microservices.Content.Structures.Categorization;
using Socigy.Microservices.Content.Structures.Posts;
using Socigy.Microservices.Content.Structures.Posts.Interactions;
using Socigy.Microservices.Content.Structures.Posts.Polls;
using Socigy.Microservices.Content.Structures.Posts.Queries;
using Socigy.Microservices.Content.Structures.Posts.Scheduling;
using Socigy.Microservices.Content.Structures.Profiles;
using Socigy.Microservices.Content.Structures.Uploads;
using Socigy.Structures;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Socigy.Microservices.Content.Structures
{
    [JsonSerializable(typeof(Interest))]
    [JsonSerializable(typeof(Category))]
    [JsonSerializable(typeof(PostInterests))]

    [JsonSerializable(typeof(ContentProfileCategory))]
    [JsonSerializable(typeof(ContentProfileInterest))]
    [JsonSerializable(typeof(UserContentProfile))]

    [JsonSerializable(typeof(Comment))]
    [JsonSerializable(typeof(PostInteraction))]
    [JsonSerializable(typeof(IEnumerable<RecommendedPost>))]
    [JsonSerializable(typeof(RecommendedPost))]

    [JsonSerializable(typeof(PostSequence))]
    [JsonSerializable(typeof(PostSequenceItem))]
    [JsonSerializable(typeof(RecurringStream))]

    [JsonSerializable(typeof(LiveStream))]

    [JsonSerializable(typeof(PollOption))]
    [JsonSerializable(typeof(PollVote))]
    [JsonSerializable(typeof(PollMetadata))]

    [JsonSerializable(typeof(Post))]
    [JsonSerializable(typeof(PostCircle))]
    [JsonSerializable(typeof(PostCollaborator))]
    [JsonSerializable(typeof(PostLocation))]

    [JsonSerializable(typeof(MediaAttachment))]

    [JsonSerializable(typeof(Series))]
    [JsonSerializable(typeof(SeriesEpisode))]

    [JsonSerializable(typeof(JsonDocument))]
    [JsonSerializable(typeof(FileMetadata))]
    [JsonSerializable(typeof(IEnumerable<RecommendedPostComment>))]
    [JsonSerializable(typeof(IEnumerable<RecommendedPostMedia>))]
    [JsonSerializable(typeof(IEnumerable<JsonUserInfo>))]
    public partial class StructuresJsonContext : JsonSerializerContext
    {
    }
}
