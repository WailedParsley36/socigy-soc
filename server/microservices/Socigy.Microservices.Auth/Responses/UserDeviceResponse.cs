using Socigy.Structures.Database;
using Socigy.Structures.Enums;
using System.Text.Json.Serialization;

namespace Socigy.Microservices.Auth.Responses
{
    public class UserDeviceResponse : IDBObject<short>
    {
        public short ID { get; set; }

        public string DeviceName { get; set; }

        public DeviceType DeviceType { get; set; }

        public bool IsNew { get; set; }
        public bool IsBlocked { get; set; }
        public bool IsTrusted { get; set; }
        public bool IsCurrent { get; set; }

        public DateTime? LastUsedAt { get; set; }
        public DateTime? CreatedAt { get; set; }

    }
}
