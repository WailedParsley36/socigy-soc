CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DROP TABLE IF EXISTS plugin_tag_assignments CASCADE;
DROP TABLE IF EXISTS plugin_tags CASCADE;
DROP TABLE IF EXISTS plugin_category_assignments CASCADE;
DROP TABLE IF EXISTS plugin_categories CASCADE;
DROP TABLE IF EXISTS plugin_usage_stats CASCADE;
DROP TABLE IF EXISTS plugin_reviews CASCADE;
DROP TABLE IF EXISTS plugin_action_logs CASCADE;
DROP TABLE IF EXISTS device_installations CASCADE;
DROP TABLE IF EXISTS plugin_installations CASCADE;
DROP TABLE IF EXISTS plugin_user_data_row CASCADE;
DROP TABLE IF EXISTS plugin_data_row CASCADE;
DROP TABLE IF EXISTS plugin_asset CASCADE;
DROP TABLE IF EXISTS plugin_store_asset CASCADE;
DROP TABLE IF EXISTS plugin_permissions CASCADE;
DROP TABLE IF EXISTS plugin_versions CASCADE;
DROP TABLE IF EXISTS localization_data CASCADE;
DROP TABLE IF EXISTS plugins CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS plugin_staff_picks CASCADE;
DROP TABLE IF EXISTS plugin_reports CASCADE;
DROP TABLE IF EXISTS plugin_review_reports CASCADE;
DROP TABLE IF EXISTS plugin_report_response CASCADE;

CREATE TABLE plugins (
    plugin_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(50) NOT NULL,
    description TEXT,
    icon_url TEXT NOT NULL,
    platforms SMALLINT DEFAULT 0,
    payment_type SMALLINT DEFAULT 0,
    price DECIMAL(10, 2),
    currency VARCHAR(3),
    core_language smallint not null,
    publish_status smallint default 0,
   	verification_status SMALLINT DEFAULT 0,
    verification_notes TEXT,
    age_rating SMALLINT DEFAULT -1,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc', now()),
    is_active BOOLEAN DEFAULT TRUE,
    owner_id UUID NOT NULL
);

CREATE TABLE localization_data (
    localization_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plugin_id UUID REFERENCES plugins(plugin_id) ON DELETE CASCADE,
    region_code VARCHAR(10) NOT NULL,
    localized_text JSONB NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc', now()),

    UNIQUE(plugin_id, region_code)
);

CREATE TABLE plugin_versions (
    version_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plugin_id UUID NOT NULL REFERENCES plugins(plugin_id) ON DELETE CASCADE,
    version_string VARCHAR(50) NOT NULL,
    system_api_version VARCHAR(50) NOT NULL,
    release_notes TEXT,
    wasm_bundle_url TEXT NOT NULL,
    config JSONB NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc', now()),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc', now()),
    verification_status SMALLINT DEFAULT 0,
    verification_notes TEXT,
    publish_status smallint default 0,
    is_active BOOLEAN DEFAULT TRUE,
    is_beta BOOLEAN DEFAULT FALSE,
    UNIQUE (plugin_id, version_string)
);

create table plugin_reports (
	report_id UUID primary KEY,
	user_id UUID not NULL,
	plugin_id UUID not NULL references plugins(plugin_id) on delete cascade,
	version_id UUID default null,

	reason_type smallint not null,
	reason_text TEXT,

	UNIQUE(user_id, plugin_id),
	foreign KEY(version_id) references plugin_versions(version_id)
);

CREATE TABLE plugin_installations (
    installation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    plugin_id UUID NOT NULL REFERENCES plugins(plugin_id) ON DELETE CASCADE,
    version_id UUID NOT NULL REFERENCES plugin_versions(version_id),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc', now()),
    last_used_at TIMESTAMP WITHOUT TIME ZONE,
    selected_localization_id UUID references localization_data(localization_id) on delete cascade, 
    UNIQUE(user_id, plugin_id, version_id)
);

CREATE TABLE permissions (
    permission_key VARCHAR(255) PRIMARY KEY,
    description TEXT,
    security_level SMALLINT DEFAULT 0
);

CREATE TABLE plugin_permissions (
    plugin_id UUID NOT NULL REFERENCES plugins(plugin_id) ON DELETE CASCADE,
    permission_key VARCHAR(255) NOT NULL REFERENCES permissions(permission_key) ON DELETE CASCADE,
    permission_description TEXT,
    is_optional BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (plugin_id, permission_key)
);

CREATE TABLE plugin_asset (
    asset_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plugin_id UUID NOT NULL REFERENCES plugins(plugin_id) ON DELETE CASCADE,
    asset_key VARCHAR(255) NOT NULL,
    media_type SMALLINT NOT NULL DEFAULT 0,
    asset_url TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc', now())
);

CREATE TABLE plugin_store_asset (
    asset_id UUID NOT NULL REFERENCES plugin_asset(asset_id) ON DELETE CASCADE,
    plugin_id UUID NOT NULL REFERENCES plugins(plugin_id) ON DELETE CASCADE,
    position SMALLINT NOT NULL
);

CREATE TABLE plugin_data_row (
    key VARCHAR(255),
    plugin_id UUID NOT NULL REFERENCES plugins(plugin_id) ON DELETE CASCADE,
    data JSONB,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc', now()),
    PRIMARY KEY(key, plugin_id)
);

CREATE TABLE plugin_user_data_row (
    key VARCHAR(255),
    user_id UUID NOT NULL,
    plugin_id UUID NOT NULL REFERENCES plugins(plugin_id) ON DELETE CASCADE,
    data JSONB,
    remove_at_uninstall BOOLEAN not null default true,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc', now()),
    PRIMARY KEY(key, plugin_id, user_id)
);

CREATE TABLE device_installations (
    device_installation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    installation_id UUID NOT NULL REFERENCES plugin_installations(installation_id) ON DELETE CASCADE,
    device_id UUID NOT NULL,
    status SMALLINT NOT NULL DEFAULT 0,
    installed_at TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc', now()),
    last_used_at TIMESTAMP WITHOUT TIME ZONE,
    UNIQUE (installation_id, device_id)
);

CREATE TABLE plugin_action_logs (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    installation_id UUID NOT NULL REFERENCES plugin_installations(installation_id) ON DELETE CASCADE,
    device_id UUID,
    action_type VARCHAR(100) NOT NULL,
    action_details JSONB,
    permission_key VARCHAR(255),
    is_security_relevant BOOLEAN DEFAULT FALSE,
    timestamp TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc', now()),
    client_info JSONB
);

CREATE TABLE plugin_reviews (
    review_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plugin_id UUID NOT NULL REFERENCES plugins(plugin_id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    review_text TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NULL,
    UNIQUE (plugin_id, user_id)
);

create table plugin_review_reports (
	report_id UUID primary KEY,
	user_id UUID not NULL,
	review_id UUID not NULL references plugin_reviews(review_id) on delete cascade,

	reason_type smallint not null,
	reason_text TEXT,

	created_at TIMESTAMP without TIME zone default timezone('utc', now()),
	updated_at TIMESTAMP without TIME zone default timezone('utc', now()),
	UNIQUE(user_id, review_id)
);

create table plugin_report_response(
	response_id UUID primary key,

	report_id UUID not null,
	report_type smallint not null,

	response_text TEXT,
	report_result smallint not null,

	created_at TIMESTAMP without TIME zone default timezone('utc', now()),
	updated_at TIMESTAMP without TIME zone default timezone('utc', now())
);

CREATE TABLE plugin_categories (
    category_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon_url TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc', now())
);

CREATE TABLE plugin_category_assignments (
    plugin_id UUID NOT NULL REFERENCES plugins(plugin_id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES plugin_categories(category_id) ON DELETE CASCADE,
    PRIMARY KEY (plugin_id, category_id)
);

CREATE TABLE plugin_tags (
    tag_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc', now())
);

CREATE TABLE plugin_tag_assignments (
    plugin_id UUID NOT NULL REFERENCES plugins(plugin_id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES plugin_tags(tag_id) ON DELETE CASCADE,
    PRIMARY KEY (plugin_id, tag_id)
);

CREATE TABLE plugin_staff_picks (
    pick_id UUID PRIMARY KEY,
    plugin_id UUID NOT NULL REFERENCES plugins(plugin_id) ON DELETE CASCADE,
    curator_id UUID NOT NULL,

    featured_reason TEXT,
    featured_from TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc', now()),
    featured_until TIMESTAMP WITHOUT TIME ZONE,

    priority SMALLINT DEFAULT 0,

    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc', now()),
    UNIQUE (plugin_id)
);

CREATE INDEX idx_plugin_staff_picks_plugin_id ON plugin_staff_picks(plugin_id);
CREATE INDEX idx_plugin_staff_picks_curator_id ON plugin_staff_picks(curator_id);
CREATE INDEX idx_plugin_staff_picks_featured_from ON plugin_staff_picks(featured_from);
CREATE INDEX idx_plugin_staff_picks_featured_until ON plugin_staff_picks(featured_until);
CREATE INDEX idx_plugin_staff_picks_priority ON plugin_staff_picks(priority);

CREATE INDEX idx_plugins_title ON plugins(title);
CREATE INDEX idx_plugins_owner_id ON plugins(owner_id);
CREATE INDEX idx_plugins_payment_type ON plugins(payment_type);
CREATE INDEX idx_plugins_verification_status ON plugins(verification_status);
CREATE INDEX idx_plugins_is_active ON plugins(is_active);

CREATE INDEX idx_plugin_versions_plugin_id ON plugin_versions(plugin_id);
CREATE INDEX idx_plugin_versions_version_string ON plugin_versions(version_string);
CREATE INDEX idx_plugin_versions_is_active ON plugin_versions(is_active);
CREATE INDEX idx_plugin_versions_is_beta ON plugin_versions(is_beta);

CREATE INDEX idx_plugin_installations_user_id ON plugin_installations(user_id);
CREATE INDEX idx_plugin_installations_plugin_id ON plugin_installations(plugin_id);
CREATE INDEX idx_plugin_installations_version_id ON plugin_installations(version_id);
CREATE INDEX idx_plugin_installations_last_used_at ON plugin_installations(last_used_at);

CREATE INDEX idx_permissions_security_level ON permissions(security_level);

CREATE INDEX idx_plugin_permissions_plugin_id ON plugin_permissions(plugin_id);
CREATE INDEX idx_plugin_permissions_permission_key ON plugin_permissions(permission_key);

CREATE INDEX idx_plugin_asset_plugin_id ON plugin_asset(plugin_id);
CREATE INDEX idx_plugin_asset_asset_key ON plugin_asset(asset_key);
CREATE INDEX idx_plugin_asset_media_type ON plugin_asset(media_type);

CREATE INDEX idx_plugin_store_asset_plugin_id ON plugin_store_asset(plugin_id);
CREATE INDEX idx_plugin_store_asset_asset_id ON plugin_store_asset(asset_id);

CREATE INDEX idx_localization_data_plugin_id ON localization_data(plugin_id);
CREATE INDEX idx_localization_data_region_code ON localization_data(region_code);

CREATE INDEX idx_plugin_data_row_plugin_id ON plugin_data_row(plugin_id);
CREATE INDEX idx_plugin_data_row_key ON plugin_data_row(key);

CREATE INDEX idx_plugin_user_data_row_plugin_id ON plugin_user_data_row(plugin_id);
CREATE INDEX idx_plugin_user_data_row_user_id ON plugin_user_data_row(user_id);
CREATE INDEX idx_plugin_user_data_row_key ON plugin_user_data_row(key);

CREATE INDEX idx_device_installations_installation_id ON device_installations(installation_id);
CREATE INDEX idx_device_installations_device_id ON device_installations(device_id);
CREATE INDEX idx_device_installations_status ON device_installations(status);

CREATE INDEX idx_plugin_action_logs_installation_id ON plugin_action_logs(installation_id);
CREATE INDEX idx_plugin_action_logs_device_id ON plugin_action_logs(device_id);
CREATE INDEX idx_plugin_action_logs_action_type ON plugin_action_logs(action_type);
CREATE INDEX idx_plugin_action_logs_is_security_relevant ON plugin_action_logs(is_security_relevant);

CREATE INDEX idx_plugin_reviews_plugin_id ON plugin_reviews(plugin_id);
CREATE INDEX idx_plugin_reviews_user_id ON plugin_reviews(user_id);
CREATE INDEX idx_plugin_reviews_rating ON plugin_reviews(rating);

CREATE INDEX idx_plugin_categories_name ON plugin_categories(name);

CREATE INDEX idx_plugin_category_assignments_category_id ON plugin_category_assignments(category_id);
CREATE INDEX idx_plugin_tag_assignments_tag_id ON plugin_tag_assignments(tag_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO plugin_service;