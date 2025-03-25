using Org.BouncyCastle.Asn1.Ocsp;
using Socigy.Microservices.Plugins.Enums;
using Socigy.Structures.Database;
using System;
using System.Text.Json.Serialization;

namespace Socigy.Microservices.Plugins.Structures
{
    public class PluginReportResponse : IDBObject<Guid>
    {
        [JsonRequired, JsonPropertyName("response_id")]
        public Guid ID { get; set; }

        public Guid ReportId { get; set; }
        public ReportType ReportType { get; set; }

        public string ResponseText { get; set; }
        public ReportResponseResult ResponseResult { get; set; }

        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
