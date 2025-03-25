using Amazon.Runtime;
using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.Extensions.Configuration;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;
using Socigy.Microservices.Content.Enums;
using System;
using System.Diagnostics;
using System.IO;
using System.Text;
using System.Threading.Tasks;

namespace Socigy.Microservices.Content.Services
{
    public class CloudflareStorageService : IStorageService
    {
        private readonly AmazonS3Client _client;
        private readonly string _ImageBucketUrl;
        private readonly string _ThumbnailBucketUrl;
        private readonly string _VideoBucketUrl;
        private readonly string _AudiosBucketUrl;

        public CloudflareStorageService(IConfiguration configuration)
        {
            var config = new AmazonS3Config()
            {
                ServiceURL = configuration.GetValue<string>(ContentConstants.CDN.ServiceUrl),
                RequestChecksumCalculation = RequestChecksumCalculation.WHEN_REQUIRED,
                ResponseChecksumValidation = ResponseChecksumValidation.WHEN_REQUIRED,
            };

            var accessKey = configuration.GetValue<string>(ContentConstants.CDN.AccessKeyId)!;
            var secretKey = configuration.GetValue<string>(ContentConstants.CDN.SecretAccessKey)!;
            var credentials = new BasicAWSCredentials(accessKey, secretKey);

            _client = new(
                credentials,
                config
            );

            _ImageBucketUrl = configuration.GetValue<string>(ContentConstants.CDN.Buckets.ImagesUrl)!;
            _VideoBucketUrl = configuration.GetValue<string>(ContentConstants.CDN.Buckets.VideosUrl)!;
            _AudiosBucketUrl = configuration.GetValue<string>(ContentConstants.CDN.Buckets.AudiosUrl)!;
        }

        public async Task<(string Url, string? ThumbnailUrl)> UploadFileAsync(Stream fileStream, string parentFolder, string extension, ContentType type, MediaType mediaType, bool createThumbnail = true)
        {
            // MEDIUM - Check uploaded files categories, interests
            // MEDIUM/HIGH - Check uploaded files NSFW, Explicity, Violence etc.

            var (bucketName, baseUrl) = DetermineBucketAndUrl(mediaType, extension);

            string fileId = Guid.NewGuid().ToString();
            string keyName = $"posts/{type.ToString().ToLowerInvariant()}/{parentFolder}/{fileId}{extension}";

            byte[] fileBytes;
            using (var memoryStream = new MemoryStream())
            {
                await fileStream.CopyToAsync(memoryStream);
                fileBytes = memoryStream.ToArray();
            }

            using (var uploadStream = new MemoryStream(fileBytes))
            {
                var putRequest = new PutObjectRequest
                {
                    BucketName = bucketName,
                    Key = keyName,
                    InputStream = uploadStream,
                    ContentType = GetContentType(extension),
                    DisablePayloadSigning = true,
                    AutoCloseStream = true,
                    ServerSideEncryptionMethod = ServerSideEncryptionMethod.AES256
                };

                var response = await _client.PutObjectAsync(putRequest);
                if (response.HttpStatusCode != System.Net.HttpStatusCode.OK)
                    throw new Exception("Failed to upload file to storage");
            }

            var resultUrl = $"{baseUrl}/{keyName}";
            string? thumbnailUrl = null;
            if (createThumbnail)
            {
                switch (mediaType)
                {
                    case MediaType.Image:
                        thumbnailUrl = $"{baseUrl}/{await GenerateImageThumbnailAsync(fileBytes, bucketName, parentFolder, fileId)}";
                        break;

                    case MediaType.Video:
                        thumbnailUrl = $"{baseUrl}/{await GenerateVideoThumbnailAsync(fileBytes, extension, bucketName, parentFolder, fileId)}";
                        break;
                }
            }

            return (resultUrl, thumbnailUrl);
        }

        private async Task<string> GenerateImageThumbnailAsync(byte[] imageBytes, string bucketName, string parentFolder, string fileId)
        {
            const int thumbnailWidth = ContentConstants.Thumbnails.Width;
            const int thumbnailHeight = ContentConstants.Thumbnails.Height;

            using var image = Image.Load(imageBytes);
            image.Mutate(x => x.Resize(thumbnailWidth, thumbnailHeight));

            using var thumbnailStream = new MemoryStream();
            image.SaveAsJpeg(thumbnailStream);
            thumbnailStream.Position = 0;

            string thumbnailKeyName = $"posts/thumbnails/{parentFolder}/{fileId}_thumbnail.jpg";

            var putRequest = new PutObjectRequest
            {
                BucketName = bucketName,
                Key = thumbnailKeyName,
                InputStream = thumbnailStream,
                ContentType = "image/jpeg",
                DisablePayloadSigning = true,
                AutoCloseStream = true,
            };

            var response = await _client.PutObjectAsync(putRequest);
            if (response.HttpStatusCode != System.Net.HttpStatusCode.OK)
                throw new Exception("Failed to upload image thumbnail to storage");

            return thumbnailKeyName;
        }
        private async Task<string> GenerateVideoThumbnailAsync(byte[] videoBytes, string extension, string bucketName, string parentFolder, string fileId)
        {
            const int thumbnailTimeInSeconds = 1;
            const string ffmpegPath = "ffmpeg";

            string tempVideoPath = Path.Combine(Path.GetTempPath(), $"{fileId}{extension}");
            string tempThumbnailPath = Path.Combine(Path.GetTempPath(), $"{fileId}_thumbnail.jpg");

            try
            {
                await File.WriteAllBytesAsync(tempVideoPath, videoBytes);

                var arguments = $"-i \"{tempVideoPath}\" -ss {thumbnailTimeInSeconds} -vframes 1 \"{tempThumbnailPath}\"";

                var processStartInfo = new ProcessStartInfo
                {
                    FileName = ffmpegPath,
                    Arguments = arguments,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };

                using (var process = Process.Start(processStartInfo))
                {
                    process.WaitForExit();
                    if (process.ExitCode != 0)
                    {
                        throw new Exception($"FFmpeg failed: {process.StandardError.ReadToEnd()}");
                    }
                }

                using var thumbnailStream = File.OpenRead(tempThumbnailPath);
                string thumbnailKeyName = $"posts/thumbnails/{parentFolder}/{fileId}_thumbnail.jpg";

                var putRequest = new PutObjectRequest
                {
                    BucketName = bucketName,
                    Key = thumbnailKeyName,
                    InputStream = thumbnailStream,
                    ContentType = "image/jpeg",
                    DisablePayloadSigning = true,
                    AutoCloseStream = true,
                };

                var response = await _client.PutObjectAsync(putRequest);
                if (response.HttpStatusCode != System.Net.HttpStatusCode.OK)
                    throw new Exception("Failed to upload video thumbnail to storage");

                return thumbnailKeyName;
            }
            finally
            {
                if (File.Exists(tempVideoPath)) File.Delete(tempVideoPath);
                if (File.Exists(tempThumbnailPath)) File.Delete(tempThumbnailPath);
            }
        }
        public async Task<string?> GenerateThumbnailAsync(string originalUrl, ContentType type, MediaType mediaType)
        {
            var urlParts = originalUrl.Split('/');
            var fileName = urlParts[^1];
            var parentFolder = urlParts[^2];

            string fileId;
            string extension;
            int dotIndex = fileName.LastIndexOf('.');
            if (dotIndex > 0)
            {
                fileId = fileName.Substring(0, dotIndex);
                extension = fileName.Substring(dotIndex);
            }
            else
            {
                fileId = fileName;
                extension = "";
            }

            var (bucketName, _) = DetermineBucketAndUrl(mediaType, extension);
            string thumbnailKeyName = $"posts/thumbnails/{parentFolder}/{fileId}_thumbnail.jpg";
            try
            {
                var metadataRequest = new GetObjectMetadataRequest
                {
                    BucketName = bucketName,
                    Key = thumbnailKeyName
                };

                await _client.GetObjectMetadataAsync(metadataRequest);

                return $"{_ThumbnailBucketUrl ?? _ImageBucketUrl}/posts/thumbnails/{parentFolder}/{fileId}_thumbnail.jpg";
            }
            catch (AmazonS3Exception ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                // Thumbnail doesn't exist, need to generate it
            }

            // Download the original file
            byte[] fileBytes;
            try
            {
                var getRequest = new GetObjectRequest
                {
                    BucketName = bucketName,
                    Key = $"posts/{type.ToString().ToLowerInvariant()}/{parentFolder}/{fileName}"
                };

                using var response = await _client.GetObjectAsync(getRequest);
                using var responseStream = response.ResponseStream;
                using var memoryStream = new MemoryStream();

                await responseStream.CopyToAsync(memoryStream);
                fileBytes = memoryStream.ToArray();
            }
            catch (AmazonS3Exception ex)
            {
                throw new Exception($"Failed to download original file: {ex.Message}");
            }

            switch (mediaType)
            {
                case MediaType.Image:
                    using (var imageStream = new MemoryStream(fileBytes))
                    {
                        await GenerateImageThumbnailAsync(fileBytes, bucketName, parentFolder, fileId);
                    }
                    break;

                case MediaType.Video:
                    await GenerateVideoThumbnailAsync(fileBytes, extension, bucketName, parentFolder, fileId);
                    break;

                default:
                    throw new NotSupportedException($"Thumbnail generation not supported for media type: {mediaType}");
            }

            return $"{_ThumbnailBucketUrl ?? _ImageBucketUrl}/posts/thumbnails/{parentFolder}/{fileId}_thumbnail.jpg";
        }

        private (string BucketName, string BaseUrl) DetermineBucketAndUrl(MediaType mediaType, string extension)
        {
            return mediaType switch
            {
                MediaType.Image => (ContentConstants.CDN.Buckets.ImagesName, _ImageBucketUrl),
                MediaType.Video => (ContentConstants.CDN.Buckets.VideosName, _VideoBucketUrl),
                MediaType.Audio => (ContentConstants.CDN.Buckets.AudiosName, _AudiosBucketUrl),
                _ => (ContentConstants.CDN.Buckets.ImagesName, _ImageBucketUrl)
            };
        }

        private static string GetContentType(string extension) => extension.ToLowerInvariant() switch
        {
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".gif" => "image/gif",
            ".webp" => "image/webp",
            ".mp4" => "video/mp4",
            ".webm" => "video/webm",
            ".mov" => "video/quicktime",
            ".avi" => "video/x-msvideo",
            ".mp3" => "audio/mpeg",
            ".wav" => "audio/wav",
            ".ogg" => "audio/ogg",
            ".m4a" => "audio/mp4",
            _ => "application/octet-stream"
        };
    }
}