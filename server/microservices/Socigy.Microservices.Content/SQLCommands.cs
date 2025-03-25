using Socigy.Microservices.Content.Enums;

namespace Socigy.Microservices.Content
{
    public static class SQLCommands
    {
        public static class Tables
        {
            public const string UserContentProfile = "user_content_profile";
            public const string ContentProfileCategory = "content_profile_category";
            public const string ContentProfileInterest = "content_profile_interest";

            public const string PostInterests = "post_interests";
            public const string Categories = "categories";
            public const string Interests = "interests";

            public const string PollOptions = "poll_options";
            public const string PollVotes = "poll_votes";

            public const string Posts = "posts";
            public const string PostInteractions = "post_interactions";

            public const string MediaAttachments = "media_attachments";
            public const string Comments = "comments";
        }

        public static class Posts
        {
            // LOW - Only public posts appear and not the circle-only etc.
            /// <summary>
            /// Required query parameters
            /// <list type="number">
            /// <item>limit -> number</item>
            /// <item>offset -> number</item>
            /// <item>user_content_profile -> guid</item>
            /// <item>content_types -> short[]</item>
            /// <item>posted_after -> datetime</item>
            /// <item>posted_before -> datetime</item>
            /// <item>creator_ids -> guid[]</item>
            /// <item>exclude_creator_ids -> boolean</item>
            /// <item>category_ids -> guid[]</item>
            /// <item>exclude_category_ids -> boolean</item>
            /// <item>interest_ids -> guid[]</item>
            /// <item>exclude_interest_ids -> boolean</item>
            /// </list>
            /// </summary>
            public static readonly string Recommend = $@"WITH UserProfileInterests AS (
    SELECT
        {Tables.Interests}.id AS interest_id,
        {Tables.ContentProfileInterest}.weight AS interest_weight
    FROM
        {Tables.Interests}
    JOIN
        {Tables.ContentProfileInterest} ON {Tables.Interests}.id = {Tables.ContentProfileInterest}.interest_id
    WHERE
        {Tables.ContentProfileInterest}.content_profile = @user_content_profile
),
InteractionCounts AS (
    SELECT
        post_id,
        SUM(CASE WHEN interaction_type = {(short)InteractionType.Like} THEN 1 ELSE 0 END) AS likes_count,
        SUM(CASE WHEN interaction_type = {(short)InteractionType.Comment} THEN 1 ELSE 0 END) AS comments_count,
        SUM(CASE WHEN interaction_type = {(short)InteractionType.Dislike} THEN 1 ELSE 0 END) AS dislikes_count,
        SUM(CASE WHEN interaction_type = {(short)InteractionType.Share} THEN 1 ELSE 0 END) AS shares_count,
        SUM(CASE WHEN interaction_type = {(short)InteractionType.View} THEN 1 ELSE 0 END) AS views_count,
        SUM(CASE WHEN interaction_type = {(short)InteractionType.Report} THEN 1 ELSE 0 END) AS reports_count
    FROM
        {Tables.PostInteractions}
    GROUP BY
        post_id
),
PostPopularity AS (
    SELECT
        {Tables.Posts}.id AS post_id,
        (
            COALESCE(SUM(CASE WHEN {Tables.PostInteractions}.interaction_type = {(short)InteractionType.Like} THEN 1 ELSE 0 END), 0) * {ContentConstants.Posts.Interactions.LikeValue} -- Likes
            + COALESCE(SUM(CASE WHEN {Tables.PostInteractions}.interaction_type = {(short)InteractionType.Comment} THEN 1 ELSE 0 END), 0) * {ContentConstants.Posts.Interactions.CommentValue} -- Comments
            + COALESCE(SUM(CASE WHEN {Tables.PostInteractions}.interaction_type = {(short)InteractionType.Share} THEN 1 ELSE 0 END), 0) * {ContentConstants.Posts.Interactions.ShareValue} -- Share
            - COALESCE(SUM(CASE WHEN {Tables.PostInteractions}.interaction_type = {(short)InteractionType.Dislike} THEN 1 ELSE 0 END), 0) * {ContentConstants.Posts.Interactions.DislikeValue} -- Dislikes
            - COALESCE(SUM(CASE WHEN {Tables.PostInteractions}.interaction_type = {(short)InteractionType.Report} THEN 1 ELSE 0 END), 0) * {ContentConstants.Posts.Interactions.ReportValue} -- Reports
            + (SELECT count(*) FROM {Tables.PollVotes} pv JOIN {Tables.PollOptions} po ON po.id = pv.poll_option_id WHERE po.post_id = {Tables.Posts}.id) * {ContentConstants.Posts.Interactions.PollVote}
        ) AS popularity_score
    FROM
        {Tables.Posts}
    LEFT JOIN
        {Tables.PostInteractions} ON {Tables.Posts}.id = {Tables.PostInteractions}.post_id
    LEFT JOIN
        {Tables.PollOptions} ON {Tables.Posts}.id = {Tables.PollOptions}.post_id
    WHERE {Tables.Posts}.publish_status = {(short)PublishStatus.Published}  -- Published
    GROUP BY {Tables.Posts}.id
),
CategoryPopularity AS (
    SELECT
        categories.id AS category_id,
        COUNT({Tables.PostInterests}.post_id) AS post_count
    FROM
        categories
    LEFT JOIN
        {Tables.Interests} ON categories.id = {Tables.Interests}.category_id
    LEFT JOIN
        {Tables.PostInterests} ON {Tables.Interests}.id = {Tables.PostInterests}.interest_id
    GROUP BY categories.id
),
InterestPopularity AS (
    SELECT
        {Tables.Interests}.id AS interest_id,
        COUNT({Tables.PostInterests}.post_id) AS post_count
    FROM
        {Tables.Interests}
    LEFT JOIN
        {Tables.PostInterests} ON {Tables.Interests}.id = {Tables.PostInterests}.interest_id
    GROUP BY {Tables.Interests}.id
),
MediaAttachments AS (
    SELECT 
        post_id,
        JSON_AGG(
            JSON_BUILD_OBJECT(
                'mediaType', media_type,
                'url', url,
                'thumbnailUrl', thumbnail_url,
                'position', position,
                'metadata', metadata
            )
        ) AS media_json
    FROM 
        {Tables.MediaAttachments}
    GROUP BY 
        post_id
),
PostComments AS (
    SELECT 
        post_id,
        JSON_AGG(
            JSON_BUILD_OBJECT(
                'id', id,
                'userId', user_id,
                'parentCommentId', parent_comment_id,
                'content', content,
                'createdAt', created_at,
                'updatedAt', updated_at
            )
        ) AS comments_json
    FROM (
        SELECT 
            id,
            post_id, 
            user_id, 
            parent_comment_id, 
            content, 
            created_at, 
            updated_at
        FROM 
            {Tables.Comments}
        WHERE 
            parent_comment_id IS NULL
        ORDER BY 
            created_at DESC
        LIMIT @comment_limit
    ) AS recent_comments
    GROUP BY 
        post_id
),
UserIds AS (
    SELECT 
        p.id AS post_id,
        JSON_AGG(DISTINCT u) AS user_json
    FROM 
        {Tables.Posts} p
    CROSS JOIN LATERAL (
        -- Post creator
        SELECT p.user_id
        UNION
        -- Comment creators
        SELECT c.user_id FROM {Tables.Comments} c WHERE c.post_id = p.id
    ) AS u
    GROUP BY 
        p.id
),
UserInteractions AS (
    SELECT
        post_id,
        BOOL_OR(CASE WHEN interaction_type = {(short)InteractionType.Like} THEN TRUE ELSE FALSE END) AS is_liked_by_me,
        BOOL_OR(CASE WHEN interaction_type = {(short)InteractionType.Dislike} THEN TRUE ELSE FALSE END) AS is_disliked_by_me,
        BOOL_OR(CASE WHEN interaction_type = {(short)InteractionType.Share} THEN TRUE ELSE FALSE END) AS is_shared_by_me,
        BOOL_OR(CASE WHEN interaction_type = {(short)InteractionType.Comment} THEN TRUE ELSE FALSE END) AS is_commented_by_me
    FROM
        {Tables.PostInteractions}
    WHERE
        user_id = @current_user_id
    GROUP BY
        post_id
)
SELECT
    {Tables.Posts}.*,
    COALESCE(pp.popularity_score, 0) AS post_popularity,
    COALESCE(cp2.post_count, 0) AS category_popularity,
    COALESCE(ip.post_count, 0) AS interest_popularity,
    COALESCE(upi.interest_weight, 0) AS user_interest_weight,
    COALESCE(ic.likes_count, 0) AS likes_count,
    COALESCE(ic.views_count, 0) AS views_count,
    COALESCE(ic.dislikes_count, 0) AS dislikes_count,
    COALESCE(ic.shares_count, 0) AS shares_count,
    COALESCE(ic.comments_count, 0) AS comments_count,
    (SELECT COUNT(*) FROM comments WHERE post_id = {Tables.Posts}.id) AS total_comments,
    COALESCE(ui.user_json::text, '[]') AS user_json,
    COALESCE(pc.comments_json::text, '[]') AS comments_json,
    COALESCE(ma.media_json::text, '[]') AS media_json,
    COALESCE(user_int.is_liked_by_me, FALSE) AS is_liked_by_me,
    COALESCE(user_int.is_disliked_by_me, FALSE) AS is_disliked_by_me,
    COALESCE(user_int.is_shared_by_me, FALSE) AS is_shared_by_me,
    COALESCE(user_int.is_commented_by_me, FALSE) AS is_commented_by_me
FROM
    {Tables.Posts}
LEFT JOIN
    PostPopularity pp ON {Tables.Posts}.id = pp.post_id
LEFT JOIN
    {Tables.PostInterests} pi ON {Tables.Posts}.id = pi.post_id
LEFT JOIN
    {Tables.Interests} i ON pi.interest_id = i.id
LEFT JOIN
    CategoryPopularity cp2 ON i.category_id = cp2.category_id
LEFT JOIN
    InterestPopularity ip ON pi.interest_id = ip.interest_id
LEFT JOIN
    UserProfileInterests upi ON upi.interest_id = pi.interest_id
LEFT JOIN
    InteractionCounts ic ON {Tables.Posts}.id = ic.post_id
LEFT JOIN
    MediaAttachments ma ON {Tables.Posts}.id = ma.post_id
LEFT JOIN
    PostComments pc ON {Tables.Posts}.id = pc.post_id
LEFT JOIN
    UserIds ui ON {Tables.Posts}.id = ui.post_id
LEFT JOIN
    UserInteractions user_int ON {Tables.Posts}.id = user_int.post_id
WHERE
    {Tables.Posts}.visibility = {(short)VisibilityType.Public}  -- Public visibility
    AND {Tables.Posts}.is_draft = FALSE
    AND {Tables.Posts}.publish_status = {(short)PublishStatus.Published} -- Published

    -- Blocked users filter
    AND NOT EXISTS (
        SELECT 1
        FROM unnest(@blocked_ids) AS blocked_id
        WHERE blocked_id = {Tables.Posts}.user_id
    )

    -- Content type filter
    AND (CASE WHEN @content_types IS NOT NULL
         THEN {Tables.Posts}.content_type = ANY(@content_types)
         ELSE TRUE END)

    -- Date filters
    AND (CASE WHEN @posted_before IS NOT NULL
         THEN {Tables.Posts}.created_at <= @posted_before
         ELSE TRUE END)
    AND (CASE WHEN @posted_after IS NOT NULL
         THEN {Tables.Posts}.created_at >= @posted_after
         ELSE TRUE END)

    -- Creator filter
    AND (CASE
         WHEN @excluded_creator_ids IS NOT NULL
         THEN {Tables.Posts}.user_id <> ALL(@excluded_creator_ids) -- Exclude specified creator IDs
         ELSE TRUE END)

    -- Category filter
    AND (CASE
         WHEN @excluded_category_ids IS NOT NULL
         THEN NOT EXISTS (
              SELECT 1
              FROM {Tables.PostInterests} pi2
              JOIN {Tables.Interests} i2 ON pi2.interest_id = i2.id
              WHERE pi2.post_id = {Tables.Posts}.id AND i2.category_id = ANY(@excluded_category_ids)
         ) -- Exclude posts with specified categories
         ELSE TRUE END)

    -- Interest filter
    AND (CASE
         WHEN @excluded_interest_ids IS NOT NULL
         THEN NOT EXISTS (
              SELECT 1
              FROM {Tables.PostInterests} pi2
              WHERE pi2.post_id = {Tables.Posts}.id AND pi2.interest_id = ANY(@excluded_interest_ids)
         ) -- Exclude posts with specified interests
         ELSE TRUE END)
ORDER BY
    (COALESCE(upi.interest_weight, 0) * {ContentConstants.Posts.Query.UserInterestsPercentage}) +  -- User Interest weight
    (COALESCE(pp.popularity_score, 0) * {ContentConstants.Posts.Query.PostPopularityPercentage}) +  -- Post popularity weight
    (COALESCE(cp2.post_count, 0) * {ContentConstants.Posts.Query.CategoryPopularityPercentage}) +       -- Category Popularity weight
    (COALESCE(ip.post_count, 0) * {ContentConstants.Posts.Query.InterestPopularityPercentage}) DESC     -- Interest popularity weight
LIMIT @limit
OFFSET @offset";

            public static readonly string Query = $@"SELECT
    p.id AS id,
    p.user_id AS user_id,
    p.content_type AS content_type,
    p.title AS title,
    p.content AS content,
    p.external_url AS external_url,
    p.visibility AS visibility,
    p.publish_status AS publish_status,
    p.is_scheduled AS is_scheduled,
    p.is_recurring AS is_recurring,
    p.scheduled_for AS scheduled_for,
    p.scheduled_at AS scheduled_at,
    p.metadata AS metadata,
    p.updated_at AS updated_at,
    COALESCE(pp.popularity_score, 0) AS post_popularity,
    COALESCE(cp.category_popularity, 0) AS category_popularity,
    COALESCE(ip.interest_popularity, 0) AS interest_popularity,
    COALESCE(upi.user_interest_weight, 0) AS user_interest_weight,
    COALESCE(likes_counts.likes_count, 0) AS likes_count,
    COALESCE(likes_counts.dislikes_count, 0) AS dislikes_count,
    COALESCE(likes_counts.views_count, 0) AS views_count,
    COALESCE(likes_counts.comments_count, 0) AS comments_count,
    (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS total_comments_count
FROM
    {Tables.Posts} p
LEFT JOIN
    polls pl ON p.id = pl.post_id
LEFT JOIN
    (SELECT post_id, COUNT(*) AS popularity_score FROM {Tables.PostInteractions} GROUP BY post_id) pp ON p.id = pp.post_id
LEFT JOIN
    (SELECT i.category_id, COUNT(*) AS category_popularity FROM post_interests pi JOIN {Tables.Interests} i ON pi.interest_id = i.id GROUP BY i.category_id) cp ON 1=1  -- Simplification: No direct link, so all rows are joined.
LEFT JOIN
    (SELECT interest_id, COUNT(*) AS interest_popularity FROM post_interests GROUP BY interest_id) ip ON 1=1  -- Simplification: No direct link, so all rows are joined.
LEFT JOIN
    (SELECT interest_id, SUM(weight) AS user_interest_weight FROM content_profile_interest GROUP BY interest_id) upi ON 1=1 -- Simplification: No direct link, so all rows are joined.
LEFT JOIN (
    SELECT
        post_id,
        SUM(CASE WHEN interaction_type = {(short)InteractionType.Like} THEN 1 ELSE 0 END) AS likes_count,
        SUM(CASE WHEN interaction_type = {(short)InteractionType.Dislike} THEN 1 ELSE 0 END) AS dislikes_count,
        SUM(CASE WHEN interaction_type = {(short)InteractionType.View} THEN 1 ELSE 0 END) AS views_count,
        SUM(CASE WHEN interaction_type = {(short)InteractionType.Comment} THEN 1 ELSE 0 END) AS comments_count
    FROM {Tables.PostInteractions}
    GROUP BY post_id
) AS likes_counts ON p.id = likes_counts.post_id
WHERE
    (@search_string IS NULL OR
     (
         LOWER(p.title) LIKE LOWER('%' || @search_string || '%') OR
         LOWER(p.content) LIKE LOWER('%' || @search_string || '%') OR
         LOWER(p.external_url) LIKE LOWER('%' || @search_string || '%') OR
         LOWER(pl.question) LIKE LOWER('%' || @search_string || '%')
     ))
    AND (@target_user_id IS NULL OR p.user_id = @target_user_id)
    AND (@creator_ids IS NULL OR p.user_id = ANY(@creator_ids))
    AND (@category_ids IS NULL OR EXISTS (
        SELECT 1
        FROM post_interests pi
        JOIN {Tables.Interests} i ON pi.interest_id = i.id
        WHERE pi.post_id = p.id AND i.category_id = ANY(@category_ids)
    ))
    AND (@interest_ids IS NULL OR EXISTS (
        SELECT 1
        FROM post_interests pi
        WHERE pi.post_id = p.id AND pi.interest_id = ANY(@interest_ids)
    ))
    AND (@excluded_creator_ids IS NULL OR NOT p.user_id = ANY(@excluded_creator_ids))
    AND (@excluded_category_ids IS NULL OR NOT EXISTS (
        SELECT 1
        FROM post_interests pi
        JOIN {Tables.Interests} i ON pi.interest_id = i.id
        WHERE pi.post_id = p.id AND i.category_id = ANY(@excluded_category_ids)
    ))
    AND (@excluded_interest_ids IS NULL OR NOT EXISTS (
        SELECT 1
        FROM post_interests pi
        WHERE pi.post_id = p.id AND pi.interest_id = ANY(@excluded_interest_ids)
    ))
    AND (@content_types IS NULL OR p.content_type = ANY(@content_types))
    AND (@posted_after IS NULL OR p.created_at >= @posted_after)
    AND (@posted_before IS NULL OR p.created_at <= @posted_before)
ORDER BY
    p.created_at DESC
LIMIT @limit OFFSET @offset";

            public static class Polls
            {
                /// <summary>
                /// Required query parameters
                /// <list type="number">
                /// <item>post_id -> guid</item>
                /// <item>user_id -> guid</item>
                /// </list>
                /// </summary>
                public const string CheckUserHasVoted = $@"SELECT EXISTS (
    SELECT 1
    FROM {Tables.PollVotes} pv
    JOIN {Tables.PollOptions} po ON pv.poll_option_id = po.id
    WHERE po.post_id = @post_id
      AND pv.user_id = @user_id
)";

                /// <summary>
                /// Required query parameters
                /// <list type="number">
                /// <item>post_id -> guid</item>
                /// <item>user_id -> guid</item>
                /// </list>
                /// </summary>
                public const string RemoveUserVotes = $@"DELETE FROM {Tables.PollVotes}
WHERE {Tables.PollOptions} IN (
    SELECT id
    FROM {Tables.PollOptions}
    WHERE post_id = @post_id
)
AND user_id = @user_id";
            }

        }

        public static class ContentProfiles
        {
            public const string CheckDefaultExists = $@"SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM {Tables.UserContentProfile}
            WHERE is_default = TRUE
            AND owner_uuid = @user_id
        ) 
        THEN TRUE 
        ELSE FALSE 
    END AS default_profile_exists";


            /// <summary>
            /// Required query parameters
            /// <list type="number">
            /// <item>content_profile_id -> uuid</item>
            /// <item>limit -> number</item>
            /// <item>offset -> number</item>
            /// </list>
            /// </summary>
            public const string GetProfileCategories = $@"SELECT * FROM {Tables.ContentProfileCategory} WHERE id = @content_profile_id LIMIT @limit OFFSET @offset";
            /// <summary>
            /// Required query parameters
            /// <list type="number">
            /// <item>content_profile_id -> uuid</item>
            /// <item>limit -> number</item>
            /// <item>offset -> number</item>
            /// </list>
            /// </summary>
            public const string GetProfileInterests = $@"SELECT * FROM {Tables.ContentProfileInterest} WHERE id = @content_profile_id LIMIT @limit OFFSET @offset";

            /// <summary>
            /// Required query parameters
            /// <list type="number">
            /// <item>limit -> number</item>
            /// <item>offset -> number</item>
            /// </list>
            /// </summary>
            public const string PopularCategories = @$"WITH category_weights AS (
    SELECT 
        cpc.category_id,
        SUM(cpc.weight) AS profile_weight
    FROM {Tables.ContentProfileCategory} cpc
    GROUP BY cpc.category_id
), 
interest_weights AS (
    SELECT 
        i.category_id,
        COUNT(pi.interest_id) AS interest_post_weight
    FROM {Tables.PostInterests} pi
    JOIN {Tables.Interests} i ON pi.interest_id = i.id
    GROUP BY i.category_id
)
SELECT 
    c.id,
    c.name,
    c.emoji,
    c.min_age ,
    c.description,
    COALESCE(cw.profile_weight, 0) AS profile_popularity,
    COALESCE(iw.interest_post_weight, 0) AS post_popularity,
    (COALESCE(cw.profile_weight, 0) + COALESCE(iw.interest_post_weight, 0)) AS total_popularity
FROM {Tables.Categories} c
LEFT JOIN category_weights cw ON c.id = cw.category_id
LEFT JOIN interest_weights iw ON c.id = iw.category_id
ORDER BY total_popularity DESC
LIMIT @limit OFFSET @offset";

            /// <summary>
            /// Required query parameters
            /// <list type="number">
            /// <item>limit -> number</item>
            /// <item>offset -> number</item>
            /// </list>
            /// </summary>
            public const string PopularInterests = $@"WITH interest_profile_weights AS (
    SELECT 
        cpi.interest_id,
        SUM(cpi.weight) AS profile_weight
    FROM {Tables.ContentProfileInterest} cpi
    GROUP BY cpi.interest_id
), 
interest_post_weights AS (
    SELECT 
        pi.interest_id,
        COUNT(pi.post_id) AS post_weight
    FROM {Tables.PostInterests} pi
    GROUP BY pi.interest_id
)
SELECT 
    i.id,
    i.category_id,
    i.name,
    i.min_age,
    i.emoji,
    i.description,
    COALESCE(ipw.profile_weight, 0) AS profile_popularity,
    COALESCE(ipw2.post_weight, 0) AS post_popularity,
    (COALESCE(ipw.profile_weight, 0) + COALESCE(ipw2.post_weight, 0)) AS total_popularity
FROM {Tables.Interests} i
LEFT JOIN interest_profile_weights ipw ON i.id = ipw.interest_id
LEFT JOIN interest_post_weights ipw2 ON i.id = ipw2.interest_id
ORDER BY total_popularity DESC
LIMIT @limit OFFSET @offset";

            /// <summary>
            /// Required query parameters
            /// <list type="number">
            /// <item>content_profile_id -> uuid</item>
            /// <item>limit -> number</item>
            /// <item>offset -> number</item>
            /// </list>
            /// </summary>
            public const string RecommendedInterests = $@"WITH category_weights AS (
    SELECT 
        cpc.category_id,
        cpc.weight AS category_weight
    FROM {Tables.ContentProfileCategory} cpc
    WHERE cpc.content_profile = @content_profile_id
), 
interest_category_scores AS (
    SELECT 
        i.id AS interest_id,
        i.name AS interest_name,
        i.emoji,
        i.category_id,
        i.min_age,
        i.description,
        cw.category_weight AS score
    FROM {Tables.Interests} i
    JOIN category_weights cw ON i.category_id = cw.category_id
)
SELECT 
    ic.interest_id AS id,
    ic.interest_name AS name,
    ic.emoji,
    ic.category_id,
    ic.min_age,
    ic.description,
    ic.score
FROM interest_category_scores ic
ORDER BY ic.score DESC, ic.interest_name ASC
LIMIT @limit OFFSET @offset";
        }
    }
}
