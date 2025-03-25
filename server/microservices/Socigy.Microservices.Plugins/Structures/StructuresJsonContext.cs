using Socigy.Microservices.Plugins.Structures.Queries;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Socigy.Microservices.Plugins.Structures
{
    [JsonSerializable(typeof(CheckPluginDbLimitsResult))]

    [JsonSerializable(typeof(DeviceInstallation))]
    [JsonSerializable(typeof(PluginInstallation))]
    [JsonSerializable(typeof(IEnumerable<PluginInstallation>))]
    [JsonSerializable(typeof(IEnumerable<DeviceInstallation>))]

    [JsonSerializable(typeof(LocalizationData))]

    [JsonSerializable(typeof(Plugin))]
    [JsonSerializable(typeof(PluginActionLog))]
    [JsonSerializable(typeof(PluginAsset))]
    [JsonSerializable(typeof(PluginCategory))]
    [JsonSerializable(typeof(PluginVersion))]
    [JsonSerializable(typeof(IEnumerable<PluginVersion>))]

    [JsonSerializable(typeof(PluginPermission))]
    [JsonSerializable(typeof(Permission))]

    [JsonSerializable(typeof(PluginReport))]
    [JsonSerializable(typeof(PluginReportResponse))]

    [JsonSerializable(typeof(PluginReview))]
    [JsonSerializable(typeof(PluginReviewReport))]

    [JsonSerializable(typeof(PluginStaffPick))]
    [JsonSerializable(typeof(PluginStoreAsset))]

    [JsonSerializable(typeof(PluginTag))]
    [JsonSerializable(typeof(PluginTagAssignment))]

    [JsonSerializable(typeof(PluginUserDataRow))]
    public partial class StructuresJsonContext : JsonSerializerContext
    {
    }
}
