using Socigy.Structures.Database;
using System.Text.Json.Serialization;

namespace Socigy.Microservices.Auth.Structures
{
    public class UserTempChallenge : IDBObject<Guid>
    {
        [JsonRequired, JsonPropertyName("owner_uuid")]
        public Guid ID { get; set; }

        public string Challenge { get; set; }

        public DateTime? CreatedAt { get; set; }
        public DateTime Expiry { get; set; }
    }
}
