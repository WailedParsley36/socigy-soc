using Socigy.Microservices.Plugins.Controllers.Store;
using Socigy.Microservices.Plugins.Requests;
using Socigy.Microservices.Plugins.Responses;
using System.Text.Json.Serialization;

namespace Socigy.Microservices.Plugins.Structures
{
    [JsonSerializable(typeof(AddPluginDbKeyRequest))]

    [JsonSerializable(typeof(CreateNewPluginRequest))]
    [JsonSerializable(typeof(CreateNewPluginVersionRequest))]

    [JsonSerializable(typeof(EditLocalizationDataRequest))]
    [JsonSerializable(typeof(EditPluginAssetRequest))]

    [JsonSerializable(typeof(PluginRecommendationRequest))]

    [JsonSerializable(typeof(PluginReportRequest))]
    [JsonSerializable(typeof(PluginReviewReportRequest))]

    [JsonSerializable(typeof(ReviewPluginVersionRequest))]
    [JsonSerializable(typeof(ReviewRequest))]
    [JsonSerializable(typeof(UploadPluginAssetsRequest))]
    [JsonSerializable(typeof(InstallPluginRequest))]
    [JsonSerializable(typeof(UpdateInstallationRequest))]
    [JsonSerializable(typeof(UpdateDeviceInstallationStatusRequest))]
    [JsonSerializable(typeof(Dictionary<string, string>))]
    public partial class RequestsJsonContext : JsonSerializerContext
    {
    }
}
