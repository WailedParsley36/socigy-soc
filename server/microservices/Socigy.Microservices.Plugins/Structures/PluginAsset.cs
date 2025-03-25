using Socigy.Microservices.Plugins.Enums;
using Socigy.Structures.Database;
using System.Text.Json.Serialization;

namespace Socigy.Microservices.Plugins.Structures
{
    public class PluginAsset : IDBObject<Guid>
    {
        [JsonRequired, JsonPropertyName("asset_id")]
        public Guid ID { get; set; }
        public Guid PluginId { get; set; }

        public string AssetKey { get; set; }
        public MediaType MediaType { get; set; } = MediaType.Image;
        public string AssetUrl { get; set; }

        public DateTime? CreatedAt { get; set; }
    }
}
