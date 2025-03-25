using Socigy.Structures.Database;
using System.Text.Json.Serialization;

namespace Socigy.Microservices.Plugins.Structures
{
    public class PluginReview : IDBObject<Guid>
    {
        [JsonRequired, JsonPropertyName("review_id")]
        public Guid ID { get; set; }
        public Guid PluginId { get; set; }
        public Guid UserId { get; set; }

        public int Rating { get; set; }
        public string ReviewText { get; set; }

        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
