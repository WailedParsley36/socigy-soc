using Socigy.Structures.Database;
using System.Text.Json.Serialization;

namespace Socigy.Microservices.Plugins.Responses
{
    public class PluginReviewResponse : IDBObject<Guid>
    {
        [JsonRequired, JsonPropertyName("review_id")]
        public Guid ID { get; set; }
        public Guid PluginId { get; set; }

        public Guid UserId { get; set; }
        public string Username { get; set; }
        public short Tag { get; set; }
        public string? IconUrl { get; set; }

        public int Rating { get; set; }
        public string ReviewText { get; set; }

        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
