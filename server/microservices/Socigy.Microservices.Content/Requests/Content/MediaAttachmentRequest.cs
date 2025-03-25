using Socigy.Microservices.Content.Enums;

namespace Socigy.Microservices.Content.Requests.Content
{
    public class MediaAttachmentRequest
    {
        public MediaType MediaType { get; set; }
        public string Url { get; set; }
        public string? ThumbnailUrl { get; set; }
        public string? Metadata { get; set; }
    }
}
