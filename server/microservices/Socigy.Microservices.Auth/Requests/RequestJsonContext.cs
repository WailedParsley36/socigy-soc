using Fido2NetLib;
using Socigy.Connectors.User.Info;
using Socigy.Microservices.Auth.Controllers.Tokens;
using Socigy.Microservices.Auth.Structures;
using System.Text.Json.Serialization;

namespace Socigy.Microservices.Auth.Requests
{
    [JsonSerializable(typeof(RegistrationRequest))]
    [JsonSerializable(typeof(EmailMfaCodeRequest))]
    [JsonSerializable(typeof(PasskeysLoginRequest))]
    [JsonSerializable(typeof(SignInWithPasskeyRequest))]
    [JsonSerializable(typeof(AuthenticatorAttestationRawResponse))]
    [JsonSerializable(typeof(AuthenticatorAssertionRawResponse))]

    [JsonSerializable(typeof(UserInfoRequest))]
    [JsonSerializable(typeof(RegisterNewUserInternalRequest))]
    [JsonSerializable(typeof(CheckInfoExistsInternalRequest))]

    [JsonSerializable(typeof(EditUserDeviceRequest))]
    [JsonSerializable(typeof(TotpCodeRequest))]

    [JsonSerializable(typeof(UserIdRequest))]
    public partial class RequestJsonContext : JsonSerializerContext
    {
    }
}
