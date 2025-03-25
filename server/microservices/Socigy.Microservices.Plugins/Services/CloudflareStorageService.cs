using Amazon.Runtime;
using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.Extensions.Configuration;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;
using Socigy.Microservices.Plugins;
using Socigy.Microservices.Plugins.Enums;
using Socigy.Structures;
using System;
using System.Diagnostics;
using System.IO;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace Socigy.Microservices.Content.Services
{
    public class CloudflareStorageService : IStorageService
    {
        private static readonly string[] _ImageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg"];
        private static readonly string[] _OtherExtensions = [".plug", ".json"];

        private const string PluginsBucket = "socigy-plugins";

        private readonly AmazonS3Client _client;
        private readonly string _PluginBucketUrl;
        public CloudflareStorageService(IConfiguration configuration)
        {
            var config = new AmazonS3Config()
            {
                ServiceURL = configuration.GetValue<string>(PluginConstants.CDN.ServiceUrl),
                RequestChecksumCalculation = RequestChecksumCalculation.WHEN_REQUIRED,
                ResponseChecksumValidation = ResponseChecksumValidation.WHEN_REQUIRED,
            };

            _client = new(
                configuration.GetValue<string>(PluginConstants.CDN.AccessKeyId)!,
                configuration.GetValue<string>(PluginConstants.CDN.SecretAccessKey)!,
                config
            );

            _PluginBucketUrl = configuration.GetValue<string>(PluginConstants.CDN.Buckets.PluginUrl)!;
        }

        public async Task<string?> UploadPluginIcon(Guid pluginId, IFormFile file)
        {
            if (file == null || file.Length == 0)
                return null;

            string extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!IsValidImageFile(file, extension))
                return null;

            string key = $"plugins/{pluginId}/icon{extension}";
            try
            {
                await using var memoryStream = new MemoryStream();
                await file.CopyToAsync(memoryStream);
                memoryStream.Position = 0;

                var putRequest = new PutObjectRequest
                {
                    BucketName = PluginsBucket,
                    Key = key,
                    InputStream = memoryStream,
                    ContentType = file.ContentType,
                    DisablePayloadSigning = true,
                    AutoCloseStream = true,
                    ServerSideEncryptionMethod = ServerSideEncryptionMethod.AES256
                };

                await _client.PutObjectAsync(putRequest);
                return $"{_PluginBucketUrl}/{key}";
            }
            catch (AmazonS3Exception ex)
            {
                Console.WriteLine($"Error uploading plugin icon: {ex.Message}");
                return null;
            }
        }
        public async Task<(string Url, MediaType Type)?> UploadPluginAsset(Guid pluginId, string assetKey, IFormFile file)
        {
            Regex rgx = Regexes.FileRegex();
            if (file == null || file.Length == 0 || !rgx.IsMatch(assetKey) || file.Length > PluginConstants.Plugins.MaxAssetSize)
                return null;

            string extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            string key = $"plugins/{pluginId}/assets/{assetKey}{extension}";
            try
            {
                await using var memoryStream = new MemoryStream();
                await file.CopyToAsync(memoryStream);
                memoryStream.Position = 0;

                var putRequest = new PutObjectRequest
                {
                    BucketName = PluginsBucket,
                    Key = key,
                    InputStream = memoryStream,
                    ContentType = file.ContentType,
                    DisablePayloadSigning = true,
                    AutoCloseStream = true,
                    ServerSideEncryptionMethod = ServerSideEncryptionMethod.AES256
                };

                await _client.PutObjectAsync(putRequest);
                var type = MediaType.Unknown;
                if (_ImageExtensions.Contains(extension))
                    type = MediaType.Image;
                else if (_OtherExtensions.Contains(extension))
                    type = MediaType.Other;

                return ($"{_PluginBucketUrl}/{key}", type);
            }
            catch (AmazonS3Exception ex)
            {
                Console.WriteLine($"Error uploading plugin icon: {ex.Message}");
                return null;
            }
        }
        public async Task<string?> UploadPluginVersionModule(Guid pluginId, Guid versionId, IFormFile module)
        {
            if (module == null || module.Length == 0)
                return null;

            string key = $"plugins/{pluginId}/{versionId}/module.wasm";
            await using var memoryStream = new MemoryStream();
            await module.CopyToAsync(memoryStream);
            memoryStream.Position = 0;

            var putRequest = new PutObjectRequest
            {
                BucketName = PluginsBucket,
                Key = key,
                InputStream = memoryStream,
                ContentType = module.ContentType,
                DisablePayloadSigning = true,
                AutoCloseStream = true,
                ServerSideEncryptionMethod = ServerSideEncryptionMethod.AES256
            };

            await _client.PutObjectAsync(putRequest);
            return $"{_PluginBucketUrl}/{key}";
        }

        private static bool IsValidImageFile(IFormFile file, string extension)
        {
            if (file.Length > PluginConstants.Plugins.MaxIconSize)
                return false;

            if (!_ImageExtensions.Contains(extension))
                return false;

            var allowedContentTypes = new[] { "image/jpeg", "image/png", "image/gif" };
            if (!allowedContentTypes.Contains(file.ContentType))
                return false;

            return true;
        }

        public async Task RemovePluginVersion(Guid pluginId, Guid versionId)
        {
            string prefix = $"plugins/{pluginId}/{versionId}/";

            try
            {
                var listRequest = new ListObjectsV2Request
                {
                    BucketName = PluginsBucket,
                    Prefix = prefix
                };

                ListObjectsV2Response listResponse;
                do
                {
                    listResponse = await _client.ListObjectsV2Async(listRequest);

                    var deleteRequest = new DeleteObjectsRequest
                    {
                        BucketName = PluginsBucket,
                        Objects = listResponse.S3Objects.Select(o => new KeyVersion { Key = o.Key }).ToList()
                    };

                    if (deleteRequest.Objects.Any())
                    {
                        await _client.DeleteObjectsAsync(deleteRequest);
                    }

                    listRequest.ContinuationToken = listResponse.NextContinuationToken;
                } while (listResponse.IsTruncated);

                Console.WriteLine($"Successfully removed plugin version: {pluginId}/{versionId}");
            }
            catch (AmazonS3Exception ex)
            {
                Console.WriteLine($"Error removing plugin version: {ex.Message}");
                throw;
            }
        }

        public async Task RemovePluginAssets(Guid pluginId, IEnumerable<string> assetKeys)
        {
            try
            {
                var keyBatches = assetKeys
                    .Select(key => $"plugins/{pluginId}/assets/{key}")
                    .Chunk(1000); // R2 Object storage limit

                foreach (var batch in keyBatches)
                {
                    var deleteRequest = new DeleteObjectsRequest
                    {
                        BucketName = PluginsBucket,
                        Objects = batch.Select(key => new KeyVersion { Key = key }).ToList()
                    };

                    await _client.DeleteObjectsAsync(deleteRequest);
                    Console.WriteLine($"Successfully removed batch of {batch.Count()} plugin assets");
                }
            }
            catch (AmazonS3Exception ex)
            {
                Console.WriteLine($"Error removing plugin assets: {ex.Message}");
                throw;
            }
        }

        public async Task RemovePlugin(Guid pluginId)
        {
            string prefix = $"plugins/{pluginId}/";

            try
            {
                // List all objects with the plugin prefix
                var listRequest = new ListObjectsV2Request
                {
                    BucketName = PluginsBucket,
                    Prefix = prefix
                };

                ListObjectsV2Response listResponse;
                do
                {
                    listResponse = await _client.ListObjectsV2Async(listRequest);

                    if (listResponse.S3Objects.Any())
                    {
                        var deleteRequest = new DeleteObjectsRequest
                        {
                            BucketName = PluginsBucket,
                            Objects = listResponse.S3Objects.Select(o => new KeyVersion { Key = o.Key }).ToList()
                        };

                        await _client.DeleteObjectsAsync(deleteRequest);
                        Console.WriteLine($"Deleted batch of {deleteRequest.Objects.Count} objects for plugin {pluginId}");
                    }

                    listRequest.ContinuationToken = listResponse.NextContinuationToken;
                } while (listResponse.IsTruncated);

                Console.WriteLine($"Successfully removed all objects for plugin: {pluginId}");
            }
            catch (AmazonS3Exception ex)
            {
                Console.WriteLine($"Error removing plugin objects: {ex.Message}");
                throw;
            }
        }
    }
}