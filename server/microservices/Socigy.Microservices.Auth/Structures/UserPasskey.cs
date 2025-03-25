using Fido2NetLib;
using Microsoft.Identity.Client.Platforms.Features.DesktopOs.Kerberos;
using Socigy.Services.Database;
using Socigy.Structures.Database;
using System.Text.Json.Serialization;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace Socigy.Microservices.Auth.Structures
{
    public class UserPasskey : IDBObject<(int, Guid)>
    {
        [JsonRequired, JsonPropertyName("id,user_uuid")]
        public (int, Guid) ID { get; set; }

        public byte[] CredentialId { get; set; }
        public byte[] PublicKey { get; set; }

        public long SignCount { get; set; }
        public DateTime? CreatedAt { get; set; }

        public static async Task<short> NextId(IDatabaseService db, Guid userId)
        {
            return ((short)((await db.GetScopedIdAsync<UserDevice, short?>("id", "user_uuid = @user_id", null,
                ("user_id", userId)) ?? -1) + 1));
        }
    }
}
