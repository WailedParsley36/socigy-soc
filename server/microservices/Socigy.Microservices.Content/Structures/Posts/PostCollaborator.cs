using Socigy.Microservices.Content.Enums;
using Socigy.Structures.Database;
using System.Text.Json.Serialization;

namespace Socigy.Microservices.Content.Structures.Posts
{
    public class PostCollaborator : IDBObject<(Guid, Guid, CollaborationRole)>
    {
        [JsonRequired, JsonPropertyName("post_id,user_id,role")]
        public (Guid, Guid, CollaborationRole) ID { get; set; }
        public int Position { get; set; }
        public DateTime? CreatedAt { get; set; }
    }
}
