using Socigy.Microservices.Plugins.Enums;
using Socigy.Structures.Database;
using System.Text.Json.Serialization;

namespace Socigy.Microservices.Plugins.Structures
{
    public class DeviceInstallation : IDBObject<Guid>
    {
        [JsonRequired, JsonPropertyName("device_installation_id")]
        public Guid ID { get; set; }
        public Guid InstallationId { get; set; }
        public Guid DeviceId { get; set; }

        public InstallationStatus Status { get; set; } = InstallationStatus.Pending;

        public DateTime? InstalledAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public DateTime? LastUsedAt { get; set; }
    }

}
