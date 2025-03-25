using Socigy.Structures.Database;
using System.Text.Json.Serialization;

namespace Socigy.Microservices.Auth.Structures
{
    public class AccountRemoval : IDBObject<Guid>
    {
        [JsonRequired, JsonPropertyName("user_uuid")]
        public Guid ID { get; set; }

        public DateTime Deadline { get; set; }
    }
}
