using Socigy.Microservices.Plugins.Responses;
using System.Text.Json.Serialization;

namespace Socigy.Microservices.Plugins.Structures
{
    [JsonSerializable(typeof(CheckPluginDbStatsResponse))]
    [JsonSerializable(typeof(PluginDbDataRowResponse))]

    [JsonSerializable(typeof(IEnumerable<PluginRecommendation>))]
    [JsonSerializable(typeof(PluginStorePageResponse))]

    [JsonSerializable(typeof(List<PluginAsset>))]
    [JsonSerializable(typeof(IEnumerable<PluginAsset>))]
    [JsonSerializable(typeof(IEnumerable<PluginDataRow>))]
    [JsonSerializable(typeof(IEnumerable<PluginUserDataRow>))]
    [JsonSerializable(typeof(IEnumerable<PluginReview>))]
    [JsonSerializable(typeof(IEnumerable<PluginInstallation>))]
    [JsonSerializable(typeof(PluginInstallation))]
    [JsonSerializable(typeof(PluginReviewResponse))]
    [JsonSerializable(typeof(IEnumerable<PluginReviewResponse>))]
    [JsonSerializable(typeof(DeviceInstallation))]
    [JsonSerializable(typeof(IEnumerable<LocalizationData>))]
    [JsonSerializable(typeof(IEnumerable<PluginDataRowResponse>))]
    [JsonSerializable(typeof(PluginDataRowResponse))]
    public partial class ResponsesJsonContext : JsonSerializerContext
    {
    }
}
