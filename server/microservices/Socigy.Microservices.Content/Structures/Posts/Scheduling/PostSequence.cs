using Socigy.Structures.Database;
using System.Text.Json.Serialization;

namespace Socigy.Microservices.Content.Structures.Posts.Scheduling
{
    public class PostSequence : IDBObject<Guid>
    {
        [JsonRequired, JsonPropertyName("id")]
        public Guid ID { get; set; }
        public Guid UserId { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public DateTime StartDate { get; set; }
        public TimeSpan TimeOfDay { get; set; }
        public int IntervalDays { get; set; }
        public bool IsActive { get; set; }
        public DateTime? NextPublishAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
