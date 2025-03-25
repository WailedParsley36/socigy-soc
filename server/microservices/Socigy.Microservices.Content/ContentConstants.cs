namespace Socigy.Microservices.Content
{
    public static class ContentConstants
    {
        public static class Thumbnails
        {
            public const int Width = 300;
            public const int Height = 300;
        }

        public static class Posts
        {
            /// <summary>
            /// Size in Bytes e.g. 10MB
            /// </summary>
            public const int MaxImageSize = 10485760;
            /// <summary>
            /// Size in Bytes e.g. 30MB
            /// </summary>
            public const int MaxVideoSize = 31457280;
            /// <summary>
            /// Size in Bytes e.g. 10MB
            /// </summary>
            public const int MaxAudioSize = 10485760;


            public static class Query
            {
                public const float PostPopularityPercentage = 0.4f;
                public const float UserInterestsPercentage = 0.3f;
                public const float CategoryPopularityPercentage = 0.2f;
                public const float InterestPopularityPercentage = 0.1f;
            }

            public static class Interactions
            {
                public const float LikeValue = 1;
                public const float PollVote = 1;

                public const float ShareValue = 1.5f;
                public const float CommentValue = 2;

                public const float DislikeValue = 0.75f;
                public const float ReportValue = 3;
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
                public const string AudiosUrl = "CDN_AUDIO_BUCKET";

                public const string ImagesName = "socigy-images";
                public const string VideosName = "socigy-videos";
                public const string AudiosName = "socigy-audios";
            }
        }
    }
}
