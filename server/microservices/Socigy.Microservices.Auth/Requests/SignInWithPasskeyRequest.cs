using Fido2NetLib;
using Socigy.Services.Communication;
using Socigy.Services.Database;
using System.Text.Json.Serialization;

namespace Socigy.Microservices.Auth.Requests
{
    public class SignInWithPasskeyRequest : IRequest
    {
        [JsonRequired]
        public AuthenticatorAssertionRawResponse Credential { get; set; }

        [JsonRequired]
        public Guid UserId { get; set; }

        public async Task<bool> IsValid(IDatabaseService database, object? additional = null)
        {
            return true;
        }
    }
}
