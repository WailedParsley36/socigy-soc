using Socigy.Structures.Database;
using System.Text.Json.Serialization;

namespace Socigy.Microservices.Plugins.Structures
{

    public class PluginPermission : IDBObject<(Guid, string)>
    {
        [JsonRequired, JsonPropertyName("plugin_id,permission_key")]
        public (Guid, string) ID { get; set; }
        public string PermissionDescription { get; set; }
        public bool IsOptional { get; set; } = false;
    }
}
