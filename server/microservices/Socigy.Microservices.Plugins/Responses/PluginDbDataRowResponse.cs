using System.Text.Json;

namespace Socigy.Microservices.Plugins.Responses
{
    public class PluginDbDataRowResponse
    {
        public Guid PluginId { get; set; }

        public string Key { get; set; }
        public JsonDocument Value { get; set; }

        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
