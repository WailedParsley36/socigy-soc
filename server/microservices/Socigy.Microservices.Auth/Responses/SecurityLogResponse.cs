using Socigy.Microservices.Auth.Enums;
using Socigy.Microservices.Auth.Structures;
using System.Text.Json.Serialization;

namespace Socigy.Microservices.Auth.Responses
{
    public class SecurityLogResponse
    {
        public int ID { get; set; }
        public SecurityEventType EventType { get; set; }

        public string Details { get; set; }

        public DateTime EventAt { get; set; }
        public string IpAddress { get; set; }

        /// <summary>
        /// JSONB Value
        /// </summary>
        public string Arguments { get; set; }
    }
}
