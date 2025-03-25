using Socigy.Microservices.Plugins.Enums;

namespace Socigy.Microservices.Plugins
{
    public static class SQLCommands
    {
        public static class Tables
        {
            public const string Plugin = "plugins";
            public const string PluginStaffPicks = "plugin_staff_picks";

            public const string PluginInstallation = "plugin_installations";

            public const string PluginCategory = "plugin_categories";
            public const string PluginCategoryAssignment = "plugin_category_assignments";

            public const string PluginTag = "plugin_tags";
            public const string PluginTagAssignment = "plugin_tag_assignments";

            public const string PluginReview = "plugin_reviews";
            public const string LocalizationData = "localization_data";

            public const string PluginAsset = "plugin_asset";

            public const string PluginDataRow = "plugin_data_row";
            public const string PluginUserDataRow = "plugin_user_data_row";
        }

        public static class Database
        {
            public const string GetPluginDbStats = $@"SELECT 
    1 AS id,
    COUNT(*) AS rows,
    COALESCE(SUM(LENGTH(data::text)), 0) AS occupied_size,
    (COUNT(*) < @max_rows) AS is_within_row_limit,
    (COALESCE(SUM(LENGTH(data::text)), 0) + @new_data_size) <= @max_size AS is_within_size_limit
FROM {Tables.PluginDataRow}
WHERE plugin_id = @plugin_id";

            public const string CheckPluginDbLimits = $@"SELECT 1 AS id,
    (COUNT(*) < @max_rows) AS is_within_row_limit,
    (COALESCE(SUM(LENGTH(data::text)), 0) + @new_data_size) <= @max_size AS is_within_size_limit
FROM {Tables.PluginDataRow}
WHERE plugin_id = @plugin_id";

            public const string GetPluginUserDbStats = $@"SELECT 
    1 AS id,
    COUNT(*) AS rows,
    COALESCE(SUM(LENGTH(data::text)), 0) AS occupied_size
FROM plugin_user_data_row
WHERE plugin_id = @plugin_id AND user_id = @user_id";

            public const string CheckPluginUserDbLimits = $@"SELECT
    1 AS id,
    (COUNT(*) < @max_rows) AS is_within_row_limit,
    (COALESCE(SUM(LENGTH(data::text)), 0) + @new_data_size) <= @max_size AS is_within_size_limit
FROM plugin_user_data_row
WHERE plugin_id = @plugin_id AND user_id = @user_id";
        }

        public static class Store
        {
            /// <summary>
            /// Required query parameters
            /// <list type="number">
            /// <item>publish_status -> smallint</item>
            /// <item>min_verification_status -> smallint</item>
            /// <item>current_date -> datetime</item>
            /// <item>region_code -> string</item>
            /// <item>platforms -> smallint</item>
            /// <item>limit -> number</item>
            /// <item>offset -> number</item>
            /// </list>
            /// </summary>
            public const string GetStaffPicks = $@"SELECT p.plugin_id, p.title, p.description, p.icon_url, p.platforms, 
               p.payment_type, p.price, p.currency, p.verification_status, 
               p.age_rating, p.created_at, p.publish_status,
               sp.featured_reason, sp.priority,
               COUNT(pr.review_id) AS review_count,
               COALESCE(AVG(pr.rating), 0) AS avg_rating,
               COUNT(DISTINCT pi.installation_id) AS installation_count
        FROM {Tables.PluginStaffPicks} sp
        JOIN {Tables.Plugin} p ON sp.plugin_id = p.plugin_id
        LEFT JOIN {Tables.PluginReview} pr ON p.plugin_id = pr.plugin_id
        LEFT JOIN {Tables.PluginInstallation} pi ON p.plugin_id = pi.plugin_id
        WHERE p.is_active = TRUE
        AND p.publish_status = ANY(@publish_status)
        AND p.verification_status = ANY(@min_verification_status)
        AND (sp.featured_until IS NULL OR sp.featured_until > @current_date)
        AND sp.featured_from <= @current_date
        AND (@region_codes IS NULL OR 
             EXISTS (SELECT 1 FROM localization_data ld 
                    WHERE ld.plugin_id = p.plugin_id 
                    AND ld.region_code = ANY(@region_codes)))
        AND (@platforms IS NULL OR (p.platforms & @platforms) > 0)
        GROUP BY p.plugin_id, p.title, p.description, p.icon_url, p.platforms, 
                 p.payment_type, p.price, p.currency, p.verification_status, 
                 p.age_rating, p.created_at, sp.featured_reason, sp.priority
        ORDER BY sp.priority DESC, avg_rating DESC
        LIMIT @limit OFFSET @offset";

            /// <summary>
            /// Required query parameters
            /// <list type="number">
            /// <item>user_id -> guid</item>
            /// <item>user_id -> string</item>
            /// </list>
            /// </summary>
            public const string Query = @$"WITH user_installed_plugins AS (
    SELECT DISTINCT plugin_id
    FROM {Tables.PluginInstallation}
    WHERE user_id = @user_id
),
plugin_categories AS (
    SELECT plugin_id, array_agg(category_id) AS categories
    FROM {Tables.PluginCategoryAssignment}
    GROUP BY plugin_id
),
plugin_tags AS (
    SELECT plugin_id, array_agg(tag_id) AS tags
    FROM {Tables.PluginTagAssignment}
    GROUP BY plugin_id
)
SELECT 
    p.plugin_id,
    p.title,
    p.description,
    p.icon_url,
    p.platforms,
    p.payment_type,
    p.price,
    p.currency,
    p.verification_status,
    p.publish_status,
    p.age_rating,
    p.created_at,
    pc.categories,
    pt.tags,
    COUNT(pr.review_id) AS review_count,
    COALESCE(AVG(pr.rating), 0) AS avg_rating,
    COUNT(DISTINCT pi.installation_id) AS installation_count
FROM 
    {Tables.Plugin} p
LEFT JOIN 
    plugin_categories pc ON p.plugin_id = pc.plugin_id
LEFT JOIN 
    plugin_tags pt ON p.plugin_id = pt.plugin_id
LEFT JOIN 
    {Tables.PluginReview} pr ON p.plugin_id = pr.plugin_id AND pr.rating IS NOT NULL
LEFT JOIN 
    {Tables.PluginInstallation} pi ON p.plugin_id = pi.plugin_id
WHERE 
    p.is_active = TRUE
    AND (@search IS NULL OR p.title ILIKE '%' || @search || '%' OR p.description ILIKE '%' || @search || '%')
    AND (
        (@min_verification_status IS NULL AND p.verification_status >= 1) OR
        p.verification_status = ANY(@min_verification_status)
    )
    AND (
        (@publish_statuses IS NULL AND p.publish_status >= 1) OR
        p.publish_status = ANY(@publish_statuses)
    )
    AND (
        @user_id IS NULL 
        OR p.plugin_id NOT IN (SELECT plugin_id FROM user_installed_plugins)
    )
    AND (
        @owner_id IS NULL
        OR p.owner_id = @owner_id
    )
    AND (
        @core_languages IS NULL 
        OR p.core_language = ANY(@core_languages)
    )
    AND (
        @region_codes IS NULL 
        OR EXISTS (
            SELECT 1 FROM {Tables.LocalizationData} ld
            WHERE ld.plugin_id = p.plugin_id
            AND ld.region_code = ANY(@region_codes)
        )
    )
    AND (
        @category_ids IS NULL 
        OR EXISTS (
            SELECT 1 FROM {Tables.PluginCategoryAssignment} pca 
            WHERE pca.plugin_id = p.plugin_id 
            AND pca.category_id = ANY(@category_ids)
        )
    )
    AND (
        @excluded_category_ids IS NULL 
        OR NOT EXISTS (
            SELECT 1 FROM {Tables.PluginCategoryAssignment} pca 
            WHERE pca.plugin_id = p.plugin_id 
            AND pca.category_id = ANY(@excluded_category_ids)
        )
    )
    AND (
        @creator_ids IS NULL 
        OR p.owner_id = ANY(@creator_ids)
    )
    AND (
        @excluded_creator_ids IS NULL 
        OR p.owner_id != ALL(@excluded_creator_ids)
    )
    AND (
        @posted_after IS NULL 
        OR p.created_at >= @posted_after
    )
    AND (
        @posted_before IS NULL 
        OR p.created_at <= @posted_before
    )
    AND (
        @payment_type IS NULL
        OR p.payment_type = @payment_type
    )
    AND (
        @platforms IS NULL
        OR (p.platforms & @platforms) = @platforms
    )
GROUP BY 
    p.plugin_id, 
    p.title, 
    p.description, 
    p.icon_url, 
    p.platforms, 
    p.payment_type, 
    p.core_language,
    p.price, 
    p.currency, 
    p.verification_status, 
    p.age_rating, 
    p.created_at,
    pc.categories,
    pt.tags
ORDER BY 
    CASE WHEN @sort_by = 'p.title' AND @sort_direction = 'ASC' THEN p.title END ASC,
    CASE WHEN @sort_by = 'p.title' AND @sort_direction = 'DESC' THEN p.title END DESC,
    CASE WHEN @sort_by = 'p.created_at' AND @sort_direction = 'ASC' THEN p.created_at END ASC,
    CASE WHEN @sort_by = 'p.created_at' AND @sort_direction = 'DESC' THEN p.created_at END DESC,
    CASE WHEN @sort_by = 'avg_rating' AND @sort_direction = 'ASC' THEN COALESCE(AVG(pr.rating), 0) END ASC,
    CASE WHEN @sort_by = 'avg_rating' AND @sort_direction = 'DESC' THEN COALESCE(AVG(pr.rating), 0) END DESC,
    CASE WHEN @sort_by = 'installation_count' AND @sort_direction = 'ASC' THEN COUNT(DISTINCT pi.installation_id) END ASC,
    CASE WHEN @sort_by = 'installation_count' AND @sort_direction = 'DESC' THEN COUNT(DISTINCT pi.installation_id) END DESC,
    CASE WHEN @sort_by = 'p.price' AND @sort_direction = 'ASC' THEN p.price END ASC,
    CASE WHEN @sort_by = 'p.price' AND @sort_direction = 'DESC' THEN p.price END DESC,
    CASE WHEN @sort_by IS NULL THEN COUNT(DISTINCT pi.installation_id) END DESC,
    CASE WHEN @sort_by IS NULL THEN COALESCE(AVG(pr.rating), 0) END DESC,
    CASE WHEN @sort_by IS NULL THEN p.created_at END DESC
LIMIT @limit
OFFSET @offset";

            /// <summary>
            /// Required query parameters
            /// <list type="number">
            /// <item>user_id -> guid</item>
            /// <item>plugin_id -> guid</item>
            /// </list>
            /// </summary>
            public static readonly string GetPluginDetails = $@"
        SELECT 
            p.plugin_id,
            p.title,
            p.description,
            p.icon_url,
            p.platforms,
            p.payment_type,
            p.price,
            p.currency,
            p.verification_status,
            p.publish_status,
            p.age_rating,
            p.created_at,
            p.owner_id,
            (SELECT array_agg(category_id) FROM plugin_category_assignments 
             WHERE plugin_id = p.plugin_id) AS categories,
            (SELECT array_agg(tag_id) FROM plugin_tag_assignments 
             WHERE plugin_id = p.plugin_id) AS tags,
            COUNT(pr.review_id) AS review_count,
            COALESCE(AVG(pr.rating), 0) AS avg_rating,
            COUNT(DISTINCT pi.installation_id) AS installation_count
        FROM 
            {Tables.Plugin} p
        LEFT JOIN 
            {Tables.PluginReview} pr ON p.plugin_id = pr.plugin_id
        LEFT JOIN 
            {Tables.PluginInstallation} pi ON p.plugin_id = pi.plugin_id
        WHERE 
            p.plugin_id = @plugin_id
            AND p.is_active = TRUE
            AND (
                p.publish_status = {(short)PublishStatus.Published}
                OR p.owner_id = @user_id
            )
        GROUP BY 
            p.plugin_id, 
            p.title, 
            p.description, 
            p.icon_url, 
            p.platforms, 
            p.payment_type, 
            p.price, 
            p.currency, 
            p.verification_status, 
            p.age_rating,
            p.created_at,
            p.owner_id
        LIMIT 1";
        }

        public static class Management
        {
            public const string DeletePluginAssets = $@"DELETE FROM {Tables.PluginAsset} WHERE plugin_id = @plugin_id AND asset_id = ANY(@asset_ids)";
            public const string CachePluginAssets = $@"SELECT asset_url, asset_key FROM {Tables.PluginAsset} WHERE plugin_id = @plugin_id LIMIT @limit OFFSET @offset";
            public const string DeletePluginLocalizations = $@"DELETE FROM {Tables.LocalizationData} WHERE plugin_id = @plugin_id AND localization_id = ANY(@localization_ids)";
        }
    }
}
