using Socigy.Structures.Database;
using System.Text.Json.Serialization;

namespace Socigy.Microservices.Content.Structures.Posts
{
    public class SeriesEpisode : IDBObject<(Guid, Guid)>
    {
        [JsonRequired, JsonPropertyName("series_id,post_id")]
        public (Guid, Guid) ID { get; set; }
        public int EpisodeNumber { get; set; }
        public string Title { get; set; }

        public bool IsPublished { get; set; }
        public DateTime? ScheduledFor { get; set; }
        public DateTime? PublishedAt { get; set; }

        public DateTime? CreatedAt { get; set; }
    }
}
