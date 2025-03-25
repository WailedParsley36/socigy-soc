using Socigy.Structures.Database;
using System.Text.Json.Serialization;
using System.Text.Json;

namespace Socigy.Microservices.Plugins.Structures
{
    public class PluginActionLog : IDBObject<Guid>
    {
        [JsonRequired, JsonPropertyName("id")]
        public Guid ID { get; set; }
        public Guid InstallationId { get; set; }
        public Guid? DeviceId { get; set; }
        public string ActionType { get; set; }
        public string ActionDetails { get; set; }

        public string PermissionUsed { get; set; }
        public bool IsSecurityRelevant { get; set; } = false;

        public DateTime? Timestamp { get; set; }
        public string ClientInfo { get; set; }
    }
}
