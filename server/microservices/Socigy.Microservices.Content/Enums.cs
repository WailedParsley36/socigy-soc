namespace Socigy.Microservices.Content.Enums
{
    public enum ContentType
    {
        Take,
        Frame,
        FullFrame,
        Music,
        Podcast,
        Quote,
        Discussion,
        Blog,
        News,
        Poll,
        Video,
        LiveTake,
        LivePodcast,
        Stream
    }

    public enum RecurrencePattern
    {
        Daily,
        Weekly,
        Monthly
    }

    public enum VisibilityType
    {
        Public,
        AllCircles,
        CustomCircles
    }

    public enum CollaborationRole
    {
        Creator,
        CoCreator,
        Featured,
        Producer,
        Editor,
        Guest,
        Mentioned,
        TeamMember
    }

    public enum PublishStatus
    {
        Draft,
        Scheduled,
        Published,
        Archived
    }

    public enum MediaType
    {
        Image,
        Video,
        Audio,
        Document,
        Other
    }

    public enum InteractionType
    {
        View,
        Like,
        Dislike,
        Share,
        Comment,
        Save,
        Report
    }

    public enum LiveStreamStatus
    {
        Scheduled,
        Live,
        Ended
    }
}
