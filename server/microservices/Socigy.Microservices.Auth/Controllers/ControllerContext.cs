using Socigy.Microservices.Auth.Controllers.Devices;
using Socigy.Microservices.Auth.Controllers.Security;
using Socigy.Microservices.Auth.Controllers.Tokens;
using Socigy.Microservices.Auth.Structures;
using System.Text.Json.Serialization;

namespace Socigy.Microservices.Auth.Controllers
{
    [JsonSerializable(typeof(TokenApiController))]
    [JsonSerializable(typeof(AuthApiController))]
    [JsonSerializable(typeof(SecurityApiController))]
    [JsonSerializable(typeof(DeviceApiController))]
    public partial class ControllerContext : JsonSerializerContext
    {
    }
}