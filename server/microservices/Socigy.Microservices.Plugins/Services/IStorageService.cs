using Socigy.Microservices.Plugins.Enums;

namespace Socigy.Microservices.Content.Services
{
    public interface IStorageService
    {
        Task<string?> UploadPluginIcon(Guid pluginId, IFormFile file);
        Task<(string Url, MediaType Type)?> UploadPluginAsset(Guid pluginId, string assetKey, IFormFile file);

        Task<string?> UploadPluginVersionModule(Guid pluginId, Guid versionId, IFormFile module);

        Task RemovePluginVersion(Guid pluginId, Guid versionId);
        Task RemovePluginAssets(Guid pluginId, IEnumerable<string> assetKeys);
        Task RemovePlugin(Guid pluginId);
    }
}
