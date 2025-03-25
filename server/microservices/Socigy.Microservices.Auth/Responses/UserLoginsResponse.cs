using Socigy.Microservices.Auth.Structures;
using System.Net;
using System.Text.Json.Serialization;

namespace Socigy.Microservices.Auth.Responses
{
    public class UserLoginsResponse
    {
        public bool? Success { get; set; }
        public string IpAddress { get; set; }
        public string UserAgent { get; set; }

        public short? DeviceId { get; set; }

        public DateTime? AttemptAt { get; set; }
    }
}
