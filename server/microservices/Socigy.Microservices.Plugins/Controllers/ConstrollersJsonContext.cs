using Socigy.Microservices.Plugins.Controllers.Store;
using Socigy.Microservices.Plugins.Requests;
using Socigy.Microservices.Plugins.Responses;
using System.Text.Json.Serialization;

namespace Socigy.Microservices.Plugins.Structures
{
    [JsonSerializable(typeof(PluginStoreController))]
    [JsonSerializable(typeof(PluginInstallationController))]
    public partial class ControllersJsonContext : JsonSerializerContext
    {
    }
}
