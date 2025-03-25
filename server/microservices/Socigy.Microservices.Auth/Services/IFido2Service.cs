using Fido2NetLib;
using Socigy.Microservices.Auth.Structures;
using Socigy.Services.Communication;
using Socigy.Structures.API.Communication;

namespace Socigy.Microservices.Auth.Services
{
    public interface IFido2Service
    {
        string GenerateChallenge(Guid targetUserId);
        Task<AsyncResult<UserPasskey>> LinkPasskeyTo(UserToken passkeyToken, AuthenticatorAttestationRawResponse request);
        Task<bool> ValidatePasskey(UserToken passkeyToken, UserPasskey passkey, AuthenticatorAssertionRawResponse credential);
    }
}
