using Socigy.Microservices.Content.Enums;
using Socigy.Structures.Database;
using System.Text.Json.Serialization;

namespace Socigy.Microservices.Content.Structures.Posts.Interactions
{
    public class PostInteraction : IDBObject<Guid>
    {
        [JsonRequired, JsonPropertyName("id")]
        public Guid ID { get; set; }
        public Guid PostId { get; set; }
        public Guid UserId { get; set; }

        public InteractionType InteractionType { get; set; }

        public float? ViewSeconds { get; set; }

        public DateTime? CreatedAt { get; set; }
    }
}
