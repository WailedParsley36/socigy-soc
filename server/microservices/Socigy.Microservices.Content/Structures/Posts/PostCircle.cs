using Socigy.Structures.Database;
using System.Text.Json.Serialization;

namespace Socigy.Microservices.Content.Structures.Posts
{
    public class PostCircle : IDBObject<(Guid, Guid)>
    {
        [JsonRequired, JsonPropertyName("post_id,circle_id")]
        public (Guid, Guid) ID { get; set; }
        public DateTime? CreatedAt { get; set; }
    }
}
