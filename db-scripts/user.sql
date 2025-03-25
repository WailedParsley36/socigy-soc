CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

drop table if exists users CASCADE;
drop table if exists user_settings CASCADE;
drop table if exists user_parental_settings CASCADE;
drop table if exists user_circles CASCADE;
drop table if exists user_relationships CASCADE;
drop table if exists user_circle_members CASCADE;
drop table if exists circle_messages  CASCADE;
drop table if exists user_contacts CASCADE;
drop table if exists user_contact_details CASCADE;
drop table if exists default_user_circles CASCADE;
drop table if exists user_circle_invitations cascade;

CREATE TABLE users (
    id UUID PRIMARY KEY,

    username VARCHAR(50) NOT NULL,
    tag SMALLINT NOT NULL,

    bio VARCHAR(500) default NULL,

    icon_url VARCHAR(255) default NULL,

    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified BOOLEAN NOT null default FALSE,

    phone_number VARCHAR(20) default null,

    registration_complete BOOLEAN not null default false,
    registered_at TIMESTAMP without TIME zone default null,

    first_name VARCHAR(50) not NULL,
    last_name VARCHAR(50) not NULL,

    birth_date DATE default null,
    is_child BOOLEAN DEFAULT FALSE,

    sex smallint default 0,

    parent_id UUID REFERENCES users(id) ON DELETE RESTRICT,
    visibility smallint not null default 0,

    UNIQUE(username, tag)
);

CREATE INDEX idx_users_parent_id ON users(parent_id);
CREATE INDEX idx_users_is_child ON users(is_child);
CREATE INDEX idx_users_username_lower ON users(lower(username));
CREATE INDEX idx_users_first_last_name ON users(first_name, last_name);
CREATE INDEX idx_users_birth_date ON users(birth_date);
CREATE INDEX idx_users_username_trgm ON users USING gin(username gin_trgm_ops);

CREATE TABLE user_settings (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    settings JSONB  
);

CREATE TABLE user_parental_settings (
    child_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    parental_settings JSONB  
);

CREATE TABLE user_relationships (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    type SMALLINT NOT NULL, 
    status SMALLINT NOT NULL DEFAULT 0, 

    requested_at TIMESTAMP DEFAULT timezone('utc', now()),
    accepted_at TIMESTAMP DEFAULT NULL,

    PRIMARY KEY (user_id, target_id, type)
);

CREATE TABLE user_circles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    name VARCHAR(50) NOT NULL,
    type SMALLINT NOT NULL DEFAULT 0, 

    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT timezone('utc', now())
);

CREATE TABLE user_circle_invitations (
    invitation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    circle_id UUID NOT NULL REFERENCES user_circles(id) ON DELETE CASCADE,
    inviter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,  
    invitee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,  

    nickname VARCHAR(30) default null,
    name_override VARCHAR(30) default null,

    status SMALLINT NOT NULL DEFAULT 0, 
    invited_at TIMESTAMP DEFAULT timezone('utc', now()),
    response_at TIMESTAMP, 

    UNIQUE(circle_id, invitee_id) 
);

CREATE TABLE user_circle_members (
    circle_id UUID NOT NULL REFERENCES user_circles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    nickname VARCHAR(30) default NULL,
    name_override VARCHAR(30) default NULL,

    role SMALLINT NOT NULL DEFAULT 0, 
    added_at TIMESTAMP DEFAULT timezone('utc', now()),

    PRIMARY KEY (circle_id, user_id)
);

CREATE TABLE circle_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    circle_id UUID NOT NULL REFERENCES user_circles(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    message TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT timezone('utc', now())
);

CREATE TABLE user_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,  

    nickname VARCHAR(100) DEFAULT null,
    first_name VARCHAR(50) DEFAULT NULL,
    last_name VARCHAR(50) DEFAULT NULL,
    matched_user_id UUID REFERENCES users(id) ON DELETE SET NULL, 

    created_at TIMESTAMP DEFAULT timezone('utc', now())
);

CREATE TABLE user_contact_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contact_id UUID NOT NULL REFERENCES user_contacts(id) ON DELETE CASCADE,  

    type SMALLINT NOT NULL,  
    value TEXT NOT NULL,  

    UNIQUE(contact_id, type, value) 
);

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO user_service;