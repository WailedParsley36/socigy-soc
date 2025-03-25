using Socigy.Microservices.Auth.Enums;
using Socigy.Services.Database;
using Socigy.Structures.Database;
using Socigy.Structures.Enums;
using System.Net;
using System.Text.Json.Serialization;

namespace Socigy.Microservices.Auth.Structures
{
    public class SecurityLog : IDBObject<(int, Guid)>
    {
        [JsonRequired, JsonPropertyName("id,user_uuid")]
        public (int, Guid) ID { get; set; }

        public SecurityEventType EventType { get; set; }

        [JsonPropertyName("event_details")]
        public string Details { get; set; }

        public DateTime EventAt { get; set; }
        public IPAddress IpAddress { get; set; }

        /// <summary>
        /// JSONB Value
        /// </summary>
        public string Arguments { get; set; }

        public static async Task<int> NextId(IDatabaseService db, Guid userId)
        {
            return ((await db.GetScopedIdAsync<SecurityLog, int?>("id", "user_uuid = @user_id", null,
                ("user_id", userId)) ?? -1) + 1);
        }
    }
}
