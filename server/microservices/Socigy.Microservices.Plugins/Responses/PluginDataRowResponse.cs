using Socigy.Structures.Database;
using System.Text.Json.Serialization;

namespace Socigy.Microservices.Plugins.Responses
{
    public class PluginDataRowResponse : IDBObject<Guid>
    {
        [JsonRequired, JsonPropertyName("plugin_id")]
        public Guid ID { get; set; }
        public Guid? UserId { get; set; }
        public string Data { get; set; }
        public string Key { get; set; }

        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
