using Socigy.Structures.Database;
using System.Text.Json.Serialization;

namespace Socigy.Microservices.Content.Structures.Posts.Scheduling
{
    public class PostSequenceItem : IDBObject<(Guid, Guid)>
    {
        [JsonRequired, JsonPropertyName("sequence_id,post_id")]
        public (Guid, Guid) ID { get; set; }
        public int Position { get; set; }
        public bool IsPublished { get; set; }
        public DateTime? PublishedAt { get; set; }
    }
}
