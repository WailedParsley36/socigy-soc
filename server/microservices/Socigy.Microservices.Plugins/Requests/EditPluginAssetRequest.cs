namespace Socigy.Microservices.Plugins.Requests
{
    public class EditPluginAssetRequest
    {
        public IFormFile? File { get; set; }
        public string AssetKey { get; set; }
    }
}
