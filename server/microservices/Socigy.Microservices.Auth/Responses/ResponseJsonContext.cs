using Socigy.Connectors.User.Info;
using Socigy.Microservices.Auth.Controllers.Tokens;
using Socigy.Microservices.Auth.Structures;
using System.Text.Json.Serialization;

namespace Socigy.Microservices.Auth.Responses
{
    [JsonSerializable(typeof(MfaRequiredResponse))]
    [JsonSerializable(typeof(PasskeyChallengeResponse))]
    [JsonSerializable(typeof(TokenResponse))]

    [JsonSerializable(typeof(CheckResponseInternalResponse))]
    [JsonSerializable(typeof(RegisterNewUserInternalResponse))]
    [JsonSerializable(typeof(RemoveRegisteredNewUserInternalResponse))]

    [JsonSerializable(typeof(IEnumerable<MFASettingsResponse>))]
    [JsonSerializable(typeof(EnableTotpResponse))]
    [JsonSerializable(typeof(IEnumerable<UserDeviceResponse>))]
    [JsonSerializable(typeof(IEnumerable<UserLoginAttempt>))]
    [JsonSerializable(typeof(IEnumerable<UserLoginsResponse>))]
    [JsonSerializable(typeof(IEnumerable<SecurityLog>))]
    [JsonSerializable(typeof(IEnumerable<SecurityLogResponse>))]
    public partial class ResponseJsonContext : JsonSerializerContext
    {
    }
}
