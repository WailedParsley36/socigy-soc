CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

drop table if exists posts cascade;
drop table if exists media_attachments cascade;
drop table if exists post_collaborators cascade;
drop table if exists locations cascade;
drop table if exists post_locations cascade;
drop table if exists series cascade;
drop table if exists series_episodes cascade;
drop table if exists post_circles cascade;

CREATE TABLE posts (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  content_type SMALLINT NOT null,
  title TEXT,
  content TEXT,                      
  external_url VARCHAR(1024),        
  visibility SMALLINT NOT NULL DEFAULT 0,
  is_scheduled BOOLEAN DEFAULT false,
  scheduled_for TIMESTAMP WITHOUT TIME ZONE,
  is_draft BOOLEAN DEFAULT false,
  metadata JSONB,                    
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc', now()),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc', now()),

  is_recurring BOOLEAN DEFAULT false,
  publish_status SMALLINT DEFAULT 0, 
  scheduled_at TIMESTAMP WITHOUT TIME ZONE
);

CREATE INDEX idx_posts_scheduled_at ON posts(scheduled_at);
CREATE INDEX idx_posts_publish_status ON posts(publish_status);
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_content_type ON posts(content_type);
CREATE INDEX idx_posts_scheduled_for ON posts(scheduled_for) WHERE is_scheduled = true;
CREATE INDEX idx_posts_created_at ON posts(created_at);

CREATE TABLE media_attachments (
  id UUID PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  media_type SMALLINT NOT NULL,   
  url VARCHAR(1024) NOT NULL,
  thumbnail_url VARCHAR(1024),
  position INTEGER DEFAULT 0,
  metadata JSONB,                    
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc', now())
);

CREATE INDEX idx_media_attachments_post_id ON media_attachments(post_id);

CREATE TABLE post_collaborators (
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role SMALLINT NOT NULL,
  position INTEGER DEFAULT 0,        
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc', now()),
  PRIMARY KEY (post_id, user_id, role)
);

CREATE INDEX idx_post_collaborators_post_id ON post_collaborators(post_id);
CREATE INDEX idx_post_collaborators_user_id ON post_collaborators(user_id);

CREATE TABLE locations (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc', now())
);

CREATE TABLE post_locations (
  id UUID PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  media_attachment_id UUID REFERENCES media_attachments(id) ON DELETE CASCADE,  
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc', now())
);

CREATE INDEX idx_post_locations_post_id ON post_locations(post_id);
CREATE INDEX idx_post_locations_location_id ON post_locations(location_id);
CREATE INDEX idx_post_locations_media_attachment_id ON post_locations(media_attachment_id);

CREATE TABLE series (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  cover_image_url VARCHAR(1024),
  content_type SMALLINT NOT NULL,  
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc', now()),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc', now())
);

CREATE TABLE series_episodes (
  series_id UUID REFERENCES series(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  episode_number INTEGER NOT NULL,
  title VARCHAR(255),

  is_published BOOLEAN DEFAULT false,
  scheduled_for TIMESTAMP WITHOUT TIME zone,
  published_at TIMESTAMP WITHOUT TIME zone,

  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc', now()),
  PRIMARY KEY (series_id, post_id)
);

CREATE INDEX idx_series_episodes_scheduled_for ON series_episodes(scheduled_for);
CREATE INDEX idx_series_episodes_is_published ON series_episodes(is_published);
CREATE INDEX idx_series_episodes_series_id ON series_episodes(series_id);
CREATE INDEX idx_series_episodes_post_id ON series_episodes(post_id);

CREATE TABLE post_circles (
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  circle_id UUID,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc', now()),
  PRIMARY KEY (post_id, circle_id)
);

CREATE INDEX idx_post_circles_post_id ON post_circles(post_id);

drop table if exists poll_options cascade;
drop table if exists poll_votes cascade;
drop table if exists polls cascade;

create table polls (
	id UUID primary key,
	post_id UUID references posts(id) on delete cascade,
	question text not null,
	created_at TIMESTAMP without TIME zone default timezone('utc', now())
);

CREATE TABLE poll_options (
  id UUID PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc', now())
);

CREATE TABLE poll_votes (
  poll_option_id UUID REFERENCES poll_options(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc', now()),
  PRIMARY KEY (poll_option_id, user_id)
);

CREATE INDEX idx_poll_options_post_id ON poll_options(post_id);
CREATE INDEX idx_poll_votes_poll_option_id ON poll_votes(poll_option_id);

drop table if exists live_streams cascade;

CREATE TABLE live_streams (
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE PRIMARY KEY,
  stream_key VARCHAR(255) UNIQUE,
  status smallint default 0,  
  started_at TIMESTAMP WITHOUT TIME ZONE,
  ended_at TIMESTAMP WITHOUT TIME ZONE,
  viewer_count INTEGER DEFAULT 0,
  max_viewer_count INTEGER DEFAULT 0,
  recording_url VARCHAR(1024),
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc', now()),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc', now())
);

drop table if exists post_interactions cascade;
drop table if exists comments cascade;

CREATE TABLE post_interactions (
  id UUID PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  view_seconds INTEGER default 0,
  interaction_type SMALLINT NOT NULL,  
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc', now())
);

CREATE TABLE comments (
  id UUID PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc', now()),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc', now())
);

CREATE INDEX idx_post_interactions_post_id ON post_interactions(post_id);
CREATE INDEX idx_post_interactions_user_id ON post_interactions(user_id);
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_parent_comment_id ON comments(parent_comment_id);

DROP TABLE IF EXISTS post_sequences CASCADE;
DROP TABLE IF EXISTS post_sequence_items CASCADE;
DROP TABLE IF EXISTS recurring_streams CASCADE;

CREATE TABLE post_sequences (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_date TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    time_of_day TIME NOT NULL,
    interval_days INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    next_publish_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc', now())
);

CREATE INDEX idx_post_sequences_user_id ON post_sequences(user_id);
CREATE INDEX idx_post_sequences_next_publish_at ON post_sequences(next_publish_at);

CREATE TABLE post_sequence_items (
    sequence_id UUID REFERENCES post_sequences(id) ON DELETE CASCADE,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    is_published BOOLEAN DEFAULT false,
    published_at TIMESTAMP WITHOUT TIME ZONE,
    PRIMARY KEY (sequence_id, post_id)
);

CREATE INDEX idx_post_sequence_items_sequence_id ON post_sequence_items(sequence_id);
CREATE INDEX idx_post_sequence_items_position ON post_sequence_items(position);
CREATE INDEX idx_post_sequence_items_is_published ON post_sequence_items(is_published);

CREATE TABLE recurring_streams (
    id UUID PRIMARY KEY,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    stream_key VARCHAR(255) UNIQUE,
    platform VARCHAR(50),
    recurrence_pattern SMALLINT NOT NULL, 
    recurrence_interval INTEGER DEFAULT 1,
    days_of_week INTEGER[], 
    start_date DATE NOT NULL,
    end_date DATE,
    time_of_day TIME NOT NULL,
    estimated_duration INTEGER, 
    next_stream_at TIMESTAMP WITHOUT TIME ZONE,
    timezone VARCHAR(50) DEFAULT 'UTC',
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc', now())
);

CREATE INDEX idx_recurring_streams_post_id ON recurring_streams(post_id);
CREATE INDEX idx_recurring_streams_next_stream_at ON recurring_streams(next_stream_at);

drop table if exists categories CASCADE;
drop table if exists interests CASCADE;

CREATE TABLE categories (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  emoji VARCHAR(10) not null,
  description text,

  min_age smallint not null default 18
);

CREATE TABLE interests (
  id UUID PRIMARY key default uuid_generate_v4(),
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  emoji VARCHAR(10) not null,
  description TEXT,

  min_age smallint not null default 18,
  UNIQUE(category_id, name)
);

drop table if exists post_interests cascade;

CREATE TABLE post_interests (
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  interest_id UUID REFERENCES interests(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, interest_id)
);

CREATE INDEX idx_post_interests_post_id ON post_interests(post_id);
CREATE INDEX idx_post_interests_interest_id ON post_interests(interest_id);

drop table if exists user_content_profile cascade;
drop table if exists content_profile_category cascade;
drop table if exists content_profile_interest cascade;

create table user_content_profile(
	id UUID not null primary KEY,
	owner_uuid UUID not null,

	name VARCHAR(50) not null,
	description text default null,

	is_default BOOLEAN default true,
	visibility smallint default 1
);

create table content_profile_category(
	content_profile UUID references user_content_profile(id),
	category_id UUID not null references categories(id),

	weight INTEGER not null,

	primary KEY(content_profile, category_id)
);
create table content_profile_interest(
	content_profile UUID references user_content_profile(id),
	interest_id UUID not null references interests(id),

	weight INTEGER not null,

	primary KEY(content_profile, interest_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO content_service;