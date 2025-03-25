using Socigy.Structures.Database;
using System.Text.Json.Serialization;

namespace Socigy.Microservices.Plugins.Structures
{
    public class PluginCategory : IDBObject<Guid>
    {
        [JsonRequired, JsonPropertyName("id")]
        public Guid ID { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public string IconUrl { get; set; }

        public DateTime CreatedAt { get; set; }
    }
}
