using Newtonsoft.Json;
using Socigy.Microservices.Auth.Services;
using System.Text.Json.Serialization;

namespace Socigy.Microservices.Auth.Responses
{
    public class PasskeyChallengeResponse
    {
        public string? Challenge { get; set; }

        public Fido2NetLib.Fido2User? User { get; set; }

        [JsonPropertyName("rp")]
        public Fido2NetLib.PublicKeyCredentialRpEntity? RelayingParty => Fido2Service._Rp;
    }
}
