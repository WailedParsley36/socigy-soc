using Socigy.Microservices.Plugins.Enums;
using Socigy.Structures.Database;
using System.Text.Json.Serialization;

namespace Socigy.Microservices.Plugins.Structures
{
    public class PluginReport : IDBObject<Guid>
    {
        [JsonRequired, JsonPropertyName("report_id")]
        public Guid ID { get; set; }

        public Guid UserId { get; set; }
        public Guid PluginId { get; set; }
        public Guid? VersionId { get; set; }

        public ReviewReportReason ReasonType { get; set; }
        public string ReasonText { get; set; }

        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
