using Socigy.Microservices.Content.Enums;

namespace Socigy.Microservices.Content.Services
{
    public interface IStorageService
    {
        Task<(string Url, string? ThumbnailUrl)> UploadFileAsync(Stream fileStream, string parentFolder, string extension, ContentType type, MediaType mediaType, bool createThumbnail = true);
        Task<string?> GenerateThumbnailAsync(string originalUrl, ContentType type, MediaType mediaType);
    }
}
