using Socigy.Microservices.Content.Enums;
using Socigy.Structures.Database;
using System.Text.Json.Serialization;

namespace Socigy.Microservices.Content.Structures.Posts
{
    public class LiveStream : IDBObject<Guid>
    {
        [JsonRequired, JsonPropertyName("post_id")]
        public Guid ID { get; set; }
        public string StreamKey { get; set; }
        public LiveStreamStatus Status { get; set; }
        public DateTime? StartedAt { get; set; }
        public DateTime? EndedAt { get; set; }
        public int ViewerCount { get; set; }
        public int MaxViewerCount { get; set; }
        public string RecordingUrl { get; set; }
        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
