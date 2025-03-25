using Socigy.Structures.Database;
using System.Text.Json.Serialization;

namespace Socigy.Microservices.Content.Structures.Posts.Polls
{
    public class PollVote : IDBObject<(Guid, Guid)>
    {
        [JsonRequired, JsonPropertyName("poll_option_id,user_id")]
        public (Guid, Guid) ID { get; set; }
        public DateTime? CreatedAt { get; set; }
    }
}
