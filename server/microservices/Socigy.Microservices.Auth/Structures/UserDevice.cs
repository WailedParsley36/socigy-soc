using Google.Protobuf.WellKnownTypes;
using Socigy.Services.Database;
using Socigy.Structures.Database;
using Socigy.Structures.Enums;
using System.Text.Json.Serialization;

namespace Socigy.Microservices.Auth.Structures
{
    public class UserDevice : IDBObject<(short, Guid)>
    {
        [JsonRequired, JsonPropertyName("id,user_uuid")]
        public (short, Guid) ID { get; set; }

        public string DeviceName { get; set; }

        [JsonPropertyName("device_type")]
        public DeviceType Type { get; set; }

        public string Fingerprint { get; set; }

        public bool IsNew { get; set; }
        public bool IsBlocked { get; set; }
        public bool IsTrusted { get; set; }

        public DateTime? LastUsedAt { get; set; }
        public DateTime? CreatedAt { get; set; }

        public static async Task<short> NextId(IDatabaseService db, Guid userId)
        {
            return (short)((await db.GetScopedIdAsync<UserDevice, short?>("id", "user_uuid = @user_id", null,
                ("user_id", userId)) ?? -1) + 1);
        }
    }
}
