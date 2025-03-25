using Socigy.Structures.Database;
using System.Text.Json.Serialization;

namespace Socigy.Microservices.Content.Structures.Posts.Polls
{
    public class PollOption : IDBObject<Guid>
    {
        [JsonRequired, JsonPropertyName("id")]
        public Guid ID { get; set; }
        public Guid PostId { get; set; }
        public string OptionText { get; set; }
        public int Position { get; set; }
        public DateTime? CreatedAt { get; set; }
    }
}
