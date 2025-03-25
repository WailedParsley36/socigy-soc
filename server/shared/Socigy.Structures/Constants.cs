using System.Data.SqlTypes;

namespace Socigy.Structures
{
    public static class Constants
    {
        public static class Microservices
        {
#if DEBUG
            public const string AuthServiceAddress = "https://local.api.socigy.com/v1/auth/";
#else
            // http://<service-name>.<namespace>.svc.cluster.local:<port>
            public const string AuthServiceAddress = "http://auth-microservice.socigy.svc.cluster.local:8080/";
#endif
        }

        public static class Auth
        {
            public static class Tokens
            {
                public const int AccessTokenValidity = 30; // Minutes
                public const int RefreshTokenValidity = 720; // Hours

                public const int EmailVerificationValidity = 6; // Hours
                public const int EmailCodeInterval = 60; // Seconds

                public const int PasskeyChallengeValidity = 15; // Minutes
                public const int PasskeyChallengeLength = 64;

                public const string AccessType = "access";
                public const string RefreshType = "refresh";
            }
        }

        public static class User
        {
            public static class Children
            {
                public const int ChildAgeLimit = 16;

                public const string ParenLinkKey = "parent-link";
                public const int ParentLinkValidity = 168; // Hours
            }
        }

        public static class Content
        {
            public static class ContentProfiles
            {
                public const string DefaultContentProfileName = "Default Profile";
            }
        }
    }
}