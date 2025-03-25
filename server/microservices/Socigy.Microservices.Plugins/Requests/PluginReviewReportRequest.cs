using Socigy.Microservices.Plugins.Enums;

namespace Socigy.Microservices.Plugins.Requests
{
    public class PluginReviewReportRequest
    {
        public ReviewReportReason ReasonType { get; set; }
        public string ReasonText { get; set; }
    }
}
