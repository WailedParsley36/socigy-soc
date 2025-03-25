using Socigy.Structures.Database;
using System.Text.Json.Serialization;

namespace Socigy.Microservices.Plugins.Structures
{
    public class PluginStoreAsset : IDBObject<(Guid, Guid)>
    {
        [JsonRequired, JsonPropertyName("asset_id,plugin_id")]
        public (Guid, Guid) ID { get; set; }
        public short Position { get; set; }
    }
}
