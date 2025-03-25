using Microsoft.AspNetCore.DataProtection;
using Socigy.Microservices.Auth.Enums;
using Socigy.Structures.Database;
using Socigy.Structures.Enums;
using System.Text.Json.Serialization;

namespace Socigy.Microservices.Auth.Structures
{
    public class MFASettings : IDBObject<(MfaType, Guid)>
    {
        [JsonRequired, JsonPropertyName("mfa_type,user_uuid")]
        public (MfaType, Guid) ID { get; set; }

        public string? Secret { get; set; }

        public bool IsEnabled { get; set; }
        public bool IsDefault { get; set; }

        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
