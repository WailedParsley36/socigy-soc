using System.Text.Json;

namespace Socigy.Microservices.Plugins.Requests
{
    public class AddPluginDbKeyRequest
    {
        public string Key { get; set; }
        public string Data { get; set; }

        public bool? RemoveAtUninstall { get; set; }
    }
}
