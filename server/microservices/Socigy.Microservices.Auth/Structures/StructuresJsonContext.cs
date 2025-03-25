using Socigy.Connectors.User.Info;
using Socigy.Microservices.Auth.Controllers.Tokens;
using Socigy.Microservices.Auth.Structures;
using Socigy.Structures;
using System.Text.Json.Serialization;

namespace Socigy.Microservices.Auth.Requests
{
    [JsonSerializable(typeof(OAuthClient))]
    [JsonSerializable(typeof(UserDevice))]
    [JsonSerializable(typeof(UserInfo))]
    [JsonSerializable(typeof(UserToken))]
    [JsonSerializable(typeof(AccountRemoval))]
    [JsonSerializable(typeof(MFASettings))]
    [JsonSerializable(typeof(SecurityLog))]
    [JsonSerializable(typeof(UserLoginAttempt))]
    [JsonSerializable(typeof(UserPasskey))]
    public partial class StructuresJsonContext : JsonSerializerContext
    {
    }
}
