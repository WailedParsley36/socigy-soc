using Socigy.Microservices.Plugins.Enums;
using Socigy.Structures.Database;
using System.Text.Json.Serialization;

namespace Socigy.Microservices.Plugins.Structures
{
    public class Permission : IDBObject<string>
    {
        [JsonRequired, JsonPropertyName("id")]
        public string ID { get; set; }
        public string Description { get; set; }
        public SecurityLevel SecurityLevel { get; set; } = SecurityLevel.Low;
    }
}
