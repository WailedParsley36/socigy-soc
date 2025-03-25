using Socigy.Structures.Database;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace Socigy.Microservices.Auth.Structures
{
    public class OAuthClient : IDBObject<string>
    {
        [JsonRequired, JsonPropertyName("client_id")]
        public string ID { get; set; }

        public string ClientSecret { get; set; }
        public string ClientName { get; set; }

        public bool IsInternal { get; set; }

        public string? RedirectUrl { get; set; }
        public DateTime? CreatedAt { get; set; }
    }
}
