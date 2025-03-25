namespace Socigy.Microservices.Plugins
{
    public class PluginConstants
    {
        public static class Plugins
        {
            /// <summary>
            /// Size in Bytes e.g. 5MB
            /// </summary>
            public const int MaxIconSize = 5242880;

            /// <summary>
            /// Size in Bytes e.g. 50MB
            /// </summary>
            public const int MaxAssetSize = 52428800;

            /// <summary>
            /// Size in Bytes e.g. 5MB
            /// </summary>
            public const int MaxConfigSize = 5242880;

            /// <summary>
            /// Size in Bytes e.g. 15MB
            /// </summary>
            public const int MaxModuleSize = 15728640;

            public static class Database
            {
                public const int MaxRows = 100;
                /// <summary>
                /// Size in Bytes e.g. 5MB
                /// </summary>
                public const int MaxSize = 5242880;

                public const int MaxUserRows = 25;
                /// <summary>
                /// Size in Bytes e.g. 2.5MB
                /// </summary>
                public const int MaxUserSize = 2621440;
            }
        }

        public static class CDN
        {
            public const string ServiceUrl = "CDN_SERVICE_URL";
            public const string SecretAccessKey = "CDN_SECRET_ACCESS_KEY";
            public const string AccessKeyId = "CDN_ACCESS_KEY_ID";
            public const string TokenValue = "CDN_TOKEN_VALUE";

            public static class Buckets
            {
                public const string ImagesUrl = "CDN_IMAGE_BUCKET";
                public const string VideosUrl = "CDN_VIDEO_BUCKET";
                public const string PluginUrl = "CDN_PLUGIN_BUCKET";

                public const string ImagesName = "socigy-images";
                public const string VideosName = "socigy-videos";
                public const string PluginsName = "socigy-plugins";
            }
        }
    }
}
