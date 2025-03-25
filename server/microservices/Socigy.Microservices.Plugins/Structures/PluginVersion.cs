using Socigy.Microservices.Plugins.Enums;
using Socigy.Structures.Database;
using System.Text.Json.Serialization;

namespace Socigy.Microservices.Plugins.Structures
{
    public class PluginVersion : IDBObject<Guid>
    {
        [JsonRequired, JsonPropertyName("version_id")]
        public Guid ID { get; set; }
        public Guid PluginId { get; set; }

        public string VersionString { get; set; }
        public string SystemApiVersion { get; set; }
        public string? ReleaseNotes { get; set; }

        public string WasmBundleUrl { get; set; }
        public string Config { get; set; }

        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        public bool IsActive { get; set; } = true;
        public bool IsBeta { get; set; } = false;

        public PublishStatus PublishStatus { get; set; } = PublishStatus.Preparing;
        public VerificationStatus VerificationStatus { get; set; } = VerificationStatus.Unverified;

        public string? VerificationNotes { get; set; }
    }
}
