using OpenTelemetry.Trace;
using Socigy.Services.Database;
using Socigy.Structures.Database;
using System.Net;
using System.Net.NetworkInformation;
using System.Security.Cryptography.Xml;
using System.Text.Json.Serialization;
using UAParser;

namespace Socigy.Microservices.Auth.Structures
{
    public class UserLoginAttempt : IDBObject<(int, Guid)>
    {
        [JsonRequired, JsonPropertyName("id,user_uuid")]
        public (int, Guid) ID { get; set; }

        public bool? Success { get; set; }
        public IPAddress IpAddress { get; set; }
        public string UserAgent { get; set; }

        public short? DeviceId { get; set; }

        public DateTime? AttemptAt { get; set; }

        public static async Task<int> NextId(IDatabaseService db, Guid userId)
        {
            return ((await db.GetScopedIdAsync<UserLoginAttempt, int?>("id", "user_uuid = @user_id", null,
                ("user_id", userId)) ?? -1) + 1);
        }
    }
}
