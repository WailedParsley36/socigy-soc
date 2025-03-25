using Socigy.Microservices.Content.Enums;
using Socigy.Structures.Database;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Socigy.Microservices.Content.Structures.Posts
{
    public class Post : IDBObject<Guid>
    {
        [JsonRequired, JsonPropertyName("id")]
        public Guid ID { get; set; }
        public Guid UserId { get; set; }
        public ContentType ContentType { get; set; }
        public string? Title { get; set; }
        public string? Content { get; set; }
        public string? ExternalUrl { get; set; }
        public VisibilityType Visibility { get; set; }
        public bool IsScheduled { get; set; }
        public DateTime? ScheduledFor { get; set; }
        public bool IsDraft { get; set; }
        public string? Metadata { get; set; }
        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public bool IsRecurring { get; set; }
        public PublishStatus PublishStatus { get; set; }
        public DateTime? ScheduledAt { get; set; }
    }

}
