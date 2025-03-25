using Socigy.Structures.Database;
using System.Text.Json.Serialization;

namespace Socigy.Microservices.Content.Structures.Posts
{
    public class PostLocation : IDBObject<Guid>
    {
        [JsonRequired, JsonPropertyName("id")]
        public Guid ID { get; set; }
        public Guid PostId { get; set; }
        public Guid LocationId { get; set; }
        public Guid? MediaAttachmentId { get; set; }
        public DateTime? CreatedAt { get; set; }
    }
}
