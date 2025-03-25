using Socigy.Structures.Database;
using System.Text.Json.Serialization;

namespace Socigy.Microservices.Plugins.Structures
{
    public class PluginInstallation : IDBObject<Guid>
    {
        [JsonRequired, JsonPropertyName("installation_id")]
        public Guid ID { get; set; }
        public Guid UserId { get; set; }
        public Guid PluginId { get; set; }
        public Guid VersionId { get; set; }

        public Guid? SelectedLocalizationId { get; set; }

        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public DateTime? LastUsedAt { get; set; }
    }
}
