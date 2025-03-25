using Socigy.Structures.Database;
using System.Text.Json.Serialization;

namespace Socigy.Microservices.Plugins.Structures
{
    public class PluginUserDataRow : IDBObject<(string, Guid, Guid)>
    {
        [JsonRequired, JsonPropertyName("key,plugin_id,user_id")]
        public (string, Guid, Guid) ID { get; set; }
        public string Data { get; set; }

        public bool RemoveAtUninstall { get; set; }

        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
