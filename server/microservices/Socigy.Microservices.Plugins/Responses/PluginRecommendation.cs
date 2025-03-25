using Socigy.Microservices.Plugins.Enums;
using Socigy.Structures.Database;
using System.Text.Json.Serialization;

namespace Socigy.Microservices.Plugins.Responses
{
    public class PluginRecommendation : IDBObject<Guid>
    {
        [JsonRequired, JsonPropertyName("plugin_id")]
        public Guid ID { get; set; }
        public string Title { get; set; }
        public string? Description { get; set; }
        public string? IconUrl { get; set; }

        public PlatformType Platforms { get; set; }
        public PaymentType PaymentType { get; set; }
        public PluginCoreLanguage CoreLanguage { get; set; }

        public decimal? Price { get; set; }
        public string? Currency { get; set; }
        public short VerificationStatus { get; set; }
        public short AgeRating { get; set; }
        public DateTime CreatedAt { get; set; }
        public IEnumerable<Guid>? Categories { get; set; }
        public IEnumerable<Guid>? Tags { get; set; }

        public int ReviewCount { get; set; }
        public double AvgRating { get; set; }
        public int InstallationCount { get; set; }

        public Guid? OwnerId { get; set; }
        public string? DeveloperUsername { get; set; }
        public short? DeveloperTag { get; set; }
        public string? DeveloperIconUrl { get; set; }
        public string? DeveloperEmail { get; set; }

        public bool? IsInstalled { get; set; }
    }
}
