using Socigy.Structures.Database;
using System.Text.Json.Serialization;

namespace Socigy.Microservices.Plugins.Structures
{
    public class PluginStaffPick : IDBObject<Guid>
    {
        [JsonRequired, JsonPropertyName("pick_id")]
        public Guid ID { get; set; }
        public Guid PluginId { get; set; }
        public Guid CuratorId { get; set; }
        public string FeaturedReason { get; set; }
        public DateTime FeaturedFrom { get; set; }
        public DateTime? FeaturedUntil { get; set; }
        public short Priority { get; set; }
        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
