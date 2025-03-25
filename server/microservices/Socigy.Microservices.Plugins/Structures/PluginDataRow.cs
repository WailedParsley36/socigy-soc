using Socigy.Structures.Database;
using System.Text.Json.Serialization;

namespace Socigy.Microservices.Plugins.Structures
{
    public class PluginDataRow : IDBObject<(string, Guid)>
    {
        [JsonRequired, JsonPropertyName("key,plugin_id")]
        public (string, Guid) ID { get; set; }
        public string Data { get; set; }

        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
