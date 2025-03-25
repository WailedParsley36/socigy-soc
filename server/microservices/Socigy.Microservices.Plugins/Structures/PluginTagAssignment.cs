using Socigy.Structures.Database;
using System.Text.Json.Serialization;

namespace Socigy.Microservices.Plugins.Structures
{
    public class PluginTagAssignment : IDBObject<(Guid, Guid)>
    {
        [JsonRequired, JsonPropertyName("plugin_id,tag_id")]
        public (Guid, Guid) ID { get; set; }
    }
}
