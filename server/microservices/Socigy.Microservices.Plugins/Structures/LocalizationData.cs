using Socigy.Structures.Database;
using System.Text.Json.Serialization;

namespace Socigy.Microservices.Plugins.Structures
{
    public class LocalizationData : IDBObject<Guid>
    {
        [JsonRequired, JsonPropertyName("localization_id")]
        public Guid ID { get; set; }
        public Guid PluginId { get; set; }

        public string RegionCode { get; set; }
        public string LocalizedText { get; set; }

        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
