using Google.Protobuf.WellKnownTypes;
using Socigy.Microservices.Auth.Enums;
using Socigy.Structures.Database;
using System.Text.Json.Serialization;

namespace Socigy.Microservices.Auth.Structures
{
    public class UserToken : IDBObject<(short, Guid, UserTokenType)>
    {
        [JsonRequired, JsonPropertyName("device_id,user_uuid,token_type")]
        public (short, Guid, UserTokenType) ID { get; set; }

        public string Token { get; set; }

        public bool IsRecovery { get; set; }

        public DateTime? IssuedAt { get; set; }
        public DateTime? ExpiresAt { get; set; }
        public DateTime? RevokedAt { get; set; }

        public DateTime? LastUsedAt { get; set; }
        public int FailedAttempts { get; set; } = 0;
    }
}
