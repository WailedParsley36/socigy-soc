export enum PostType {
    /// <summary>
    /// Short videos similar to YT Shorts
    /// </summary>
    Take,
    /// <summary>
    /// Vertical live videos
    /// </summary>
    LiveTakes,

    /// <summary>
    /// Horizontal live videos
    /// </summary>
    Streams,

    /// <summary>
    /// Image focused post with description
    /// </summary>
    Frame,
    /// <summary>
    /// FullScreen Image focused post with description
    /// </summary>
    FullFrame,

    /// <summary>
    /// Text focused post with images
    /// </summary>
    Quote,

    /// <summary>
    /// Podcast post
    /// </summary>
    Podcast,

    /// <summary>
    /// Created discussion
    /// </summary>
    Discussion,

    /// <summary>
    /// Music tracks
    /// </summary>
    Track
}

export enum ContentVisibility {
    Public = 1,
    Unlisted = 2,
    Private = 4,
    Followers = 8,
    Subscription = 16,
    Custom = 32,
}

export enum PostCustomVisibility {
    Visible,
    Unlisted,
    TimeLimited,
    Restricted
}