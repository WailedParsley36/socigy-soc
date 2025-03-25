using Socigy.Microservices.Content.Enums;
using Socigy.Microservices.Content.Structures.Posts.Interactions;
using Socigy.Structures;
using Socigy.Structures.Database;
using System.Text.Json.Serialization;

namespace Socigy.Microservices.Content.Structures.Posts.Queries
{
    public class RecommendedPost : IDBObject<Guid>
    {
        [JsonRequired, JsonPropertyName("id")]
        public Guid ID { get; set; }

        public Guid UserId { get; set; }

        // All Guids of this post and relations
        public string UserJson { get; set; }
        public string CommentsJson { get; set; }
        public IEnumerable<RecommendedPostComment>? Comments { get; set; }

        public string MediaJson { get; set; }
        public IEnumerable<RecommendedPostMedia>? Media { get; set; }

        public ContentType ContentType { get; set; }

        public string? Title { get; set; }
        public string? Content { get; set; }
        public string? ExternalUrl { get; set; }

        public VisibilityType Visibility { get; set; }
        public PublishStatus PublishStatus { get; set; }

        public bool IsScheduled { get; set; }
        public bool IsRecurring { get; set; }
        public DateTime? ScheduledFor { get; set; }
        public DateTime? ScheduledAt { get; set; }

        //public bool IsDraft { get; set; }
        public string? Metadata { get; set; }

        //public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; } // When Status changes

        public int PostPopularity { get; set; }
        public int CategoryPopularity { get; set; }
        public int InterestPopularity { get; set; }

        public int UserInterestWeight { get; set; }

        public int LikesCount { get; set; }
        public int DislikesCount { get; set; }
        public int SharesCount { get; set; }
        public int ViewsCount { get; set; }
        public int CommentsCount { get; set; }
        public int TotalComments { get; set; }

        // TODO: Add these bools to Query, Recommend
        public bool IsLikedByMe { get; set; }
        public bool IsDislikedByMe { get; set; }
        public bool IsSharedByMe { get; set; }
        public bool IsCommentedByMe { get; set; }
    }

    public class JsonUserInfo
    {
        [JsonPropertyName("user_id")]
        public Guid UserId { get; set; }
    }
    public class UserShallowInfo
    {
        public string Username { get; set; }
        public short Tag { get; set; }

        public string? IconUrl { get; set; }
    }

    public class RecommendedPostMedia
    {
        [JsonPropertyName("mediaType")]
        public MediaType MediaType { get; set; }
        [JsonPropertyName("url")]
        public string Url { get; set; }
        [JsonPropertyName("thumbnailUrl")]
        public string ThumbnailUrl { get; set; }
        [JsonPropertyName("position")]
        public int Position { get; set; }
        [JsonPropertyName("metadata")]
        public string? Metadata { get; set; }
    }

    public class RecommendedPostComment
    {
        [JsonPropertyName("id")]
        public Guid Id { get; set; }
        [JsonPropertyName("userId")]
        public Guid UserId { get; set; }
        [JsonPropertyName("parentCommentId")]
        public Guid? ParentCommentId { get; set; }

        [JsonPropertyName("content")]
        public string Content { get; set; }

        [JsonPropertyName("createdAt")]
        public DateTime? CreatedAt { get; set; }
        [JsonPropertyName("updatedAt")]
        public DateTime? UpdatedAt { get; set; }
    }
}