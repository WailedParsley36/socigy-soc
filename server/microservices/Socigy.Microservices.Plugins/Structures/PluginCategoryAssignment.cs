using Socigy.Structures.Database;
using System.Text.Json.Serialization;

namespace Socigy.Microservices.Plugins.Structures
{
    public class PluginCategoryAssignment : IDBObject<(Guid, Guid)>
    {
        [JsonRequired, JsonPropertyName("plugin_id,category_id")]
        public (Guid, Guid) ID { get; set; }
    }

}
