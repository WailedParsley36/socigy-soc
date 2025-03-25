using Socigy.Microservices.Plugins.Enums;

namespace Socigy.Microservices.Plugins.Requests
{
    public class PluginReportRequest
    {
        public ReviewReportReason ReasonType { get; set; }
        public string ReasonText { get; set; }

        public Guid? VersionId { get; set; }
    }
}
