using Socigy.Microservices.Plugins.Enums;
using Socigy.Structures.Database;
using System.Text.Json.Serialization;

namespace Socigy.Microservices.Plugins.Structures
{
    public class Plugin : IDBObject<Guid>
    {
        [JsonRequired, JsonPropertyName("plugin_id")]
        public Guid ID { get; set; }
        public string Title { get; set; }
        public string? Description { get; set; }
        public string IconUrl { get; set; }

        public PaymentType PaymentType { get; set; } = PaymentType.Free;
        public PlatformType Platforms { get; set; }
        public decimal? Price { get; set; }

        public PublishStatus PublishStatus { get; set; }
        public PluginCoreLanguage CoreLanguage { get; set; }
        public VerificationStatus VerificationStatus { get; set; } = VerificationStatus.Unverified;
        public string? VerificationNotes { get; set; }
        public short? AgeRating { get; set; }

        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public bool IsActive { get; set; } = true;

        public Guid OwnerId { get; set; }
    }
}
