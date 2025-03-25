using Socigy.Microservices.Content.Enums;
using Socigy.Structures.Database;
using System.Text.Json.Serialization;

namespace Socigy.Microservices.Content.Structures.Posts
{
    public class MediaAttachment : IDBObject<Guid>
    {
        [JsonRequired, JsonPropertyName("id")]
        public Guid ID { get; set; }
        public Guid PostId { get; set; }
        public MediaType MediaType { get; set; }
        public string Url { get; set; }
        public string ThumbnailUrl { get; set; }
        public int Position { get; set; }
        public string Metadata { get; set; }
        public DateTime? CreatedAt { get; set; }
    }
}
