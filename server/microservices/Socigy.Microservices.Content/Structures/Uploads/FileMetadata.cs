using Socigy.Microservices.Content.Enums;

namespace Socigy.Microservices.Content.Structures.Uploads
{
    public class FileMetadata
    {
        public string FileName { get; set; }
        public ContentType Type { get; set; }
        public long FileSize { get; set; }
    }
}
