using Socigy.Structures.Database;
using System.Text.Json.Serialization;

namespace Socigy.Microservices.Content.Structures.Posts.Polls
{
    public class Poll : IDBObject<Guid>
    {
        [JsonRequired, JsonPropertyName("poll_id")]
        public Guid ID { get; set; }

        public Guid PostId { get; set; }
        public string Question { get; set; }
        public DateTime? CreatedAt { get; set; }
    }
}
