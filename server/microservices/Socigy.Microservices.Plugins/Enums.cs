namespace Socigy.Microservices.Plugins.Enums
{
    public enum PaymentType
    {
        Free,
        OneTime,
        Subscription
    }

    public enum VerificationStatus
    {
        Unverified,
        Pending,
        Verified,
        Malicious
    }

    public enum PluginCoreLanguage
    {
        Rust
    }

    public enum PublishStatus
    {
        Preparing,
        Reviewing,
        Published,
        TakenDown
    }

    public enum ReportType
    {
        Plugin,
        PluginReview
    }

    public enum ReportResponseResult
    {
        Invalid = 0,

        Valid = 1,
        Watching = 2,
        Striked = 4,

        Banned = 8
    }

    [Flags]
    public enum PlatformType
    {
        All = 0,
        Mobile = 1,
        Tv = 2,
        Car = 4,
        Watch = 8,
        Desktop = 16,
        Web = 32,

        Android = 64,
        IOS = 128,
        Windows = 256,
        Linux = 512
    }

    public enum SecurityLevel
    {
        Low,
        Medium,
        High
    }

    public enum ReviewReportReason
    {
        Toxic,
        Offensive,
        NotHelpfull,
        Lie
    }

    public enum MediaType
    {
        Unknown,
        Image,
        Video,
        Other,
    }

    public enum InstallationStatus
    {
        Pending = 0,       // Initial state when installation is requested but not yet complete
        Installing = 1,    // Currently being installed on the device
        Installed = 2,     // Successfully installed but not yet used
        Used = 3,          // Plugin has been used at least once
        Failed = 4,        // Installation attempt failed
        Disabled = 5,      // Temporarily disabled by user or system
        Updating = 6,      // Currently being updated to a new version
        Uninstalled = 7    // Completely removed from the device
    }

}
