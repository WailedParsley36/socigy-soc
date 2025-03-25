drop table if exists oauth_logins CASCADE;
drop table if exists oauth_clients CASCADE;
drop table if exists passkey_registrations CASCADE;
drop table if exists user_devices CASCADE;
drop table if exists user_tokens CASCADE;
drop table if exists login_attempts CASCADE;
drop table if exists security_logs CASCADE;
drop table if exists mfa_settings CASCADE;
drop table if exists account_removals CASCADE;
drop table if exists user_temp_challenges CASCADE;
drop table if exists parent_anonymous_account CASCADE;

CREATE TABLE oauth_logins (
    id INTEGER,
    user_uuid UUID NOT NULL,
    provider VARCHAR(50) NOT NULL,            
    provider_user_id VARCHAR(255) NOT NULL,     
    access_token TEXT,                          
    refresh_token TEXT,
    token_expires TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc', now()),

    primary KEY(id, user_uuid)
);

CREATE TABLE oauth_clients (
    client_id VARCHAR(255) PRIMARY KEY,
    client_secret VARCHAR(512) NOT NULL,  
    client_name VARCHAR(255),
    is_internal BOOLEAN DEFAULT FALSE,     
    redirect_uri TEXT,                     
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc', now())
);

CREATE TABLE passkey_registrations (
    id INTEGER,
    user_uuid UUID NOT NULL,
    credential_id BYTEA NOT NULL,  
    public_key BYTEA NOT NULL,     
    sign_count BIGINT DEFAULT 0,   
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc', now()),

    primary KEY(id, user_uuid)
);

CREATE TABLE user_devices (
    id SMALLINT,
    user_uuid UUID NOT NULL,
    device_name VARCHAR(255),      
    device_type SMALLINT,

    fingerprint VARCHAR(50),

    is_new BOOLEAN default true,
    is_trusted BOOLEAN default false,
    is_blocked BOOLEAN DEFAULT FALSE,
    last_used_at TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc', now()),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT timezone('utc', now()),

    primary KEY(id, user_uuid)
);

CREATE TABLE user_tokens (
    device_id SMALLINT NOT NULL,
    user_uuid UUID not null,
    token_type smallint not NULL,         

    token VARCHAR(512) NOT NULL,    

    is_recovery BOOLEAN default null,

    issued_at TIMESTAMP without TIME ZONE DEFAULT timezone('utc', now()),
    expires_at TIMESTAMP without TIME zone not NULL,
    revoked_at TIMESTAMP without TIME zone default null,
    last_used_at TIMESTAMP without TIME zone default null,

    failed_attempts INTEGER not null default 0,

   	primary KEY(device_id, user_uuid, token_type),
    CONSTRAINT fk_token_device
      FOREIGN KEY(device_id, user_uuid)
      REFERENCES user_devices(id, user_uuid)
      ON DELETE cascade
);

create table parent_anonymous_account(
	id UUID not null primary KEY,
	email VARCHAR(50) not null,
	password VARCHAR(255) not null,
	created_at TIMESTAMP without TIME zone default timezone('utc', now())
);

create table user_temp_challenges(
	owner_uuid UUID not null,
	challenge_key VARCHAR(50) not null,
	challenge VARCHAR(512) not null,

	created_at TIMESTAMP without TIME zone not null default timezone('utc', now()),
	expiry TIMESTAMP without TIME zone not null,

	primary KEY(owner_uuid, challenge_key)
);

CREATE TABLE login_attempts (
    id INTEGER,
    user_uuid UUID,                 
    attempt_at TIMESTAMP without TIME ZONE DEFAULT timezone('utc', now()),
    success BOOLEAN default null,
    ip_address INET,                
    user_agent TEXT,
    device_id SMALLINT,             
    CONSTRAINT fk_attempt_device
      FOREIGN KEY(device_id, user_uuid)
      REFERENCES user_devices(id, user_uuid)
      ON DELETE SET null,

    primary KEY(id, user_uuid)
);

CREATE TABLE security_logs (
    id INTEGER,
    user_uuid UUID,                 
    event_type SMALLINT NOT NULL,  
    event_details TEXT,
    event_at TIMESTAMP without TIME ZONE DEFAULT timezone('utc', now()),
    ip_address INET,

    arguments JSONB default null,

    primary key(id, user_uuid)
);

-- Table for MFA Settings
CREATE TABLE mfa_settings (
    user_uuid UUID NOT NULL,
    mfa_type SMALLINT NOT NULL,   
    secret VARCHAR(255),             
    is_enabled BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN default false,
    created_at TIMESTAMP without TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP without TIME ZONE DEFAULT timezone('utc', now()),

    primary KEY(mfa_type, user_uuid)
);

create table account_removals(
	user_uuid UUID not null primary KEY,
	deadline TIMESTAMP without TIME zone not null,
	created_at TIMESTAMP without TIME zone default timezone('utc', now())
);

CREATE INDEX idx_oauth_user_uuid ON oauth_logins(user_uuid);

CREATE UNIQUE INDEX idx_oauth_provider_user ON oauth_logins(provider, provider_user_id);

CREATE INDEX idx_passkey_user_uuid ON passkey_registrations(user_uuid);

CREATE UNIQUE INDEX idx_passkey_credential ON passkey_registrations(credential_id);

CREATE INDEX idx_device_user_uuid ON user_devices(user_uuid);

CREATE INDEX idx_device_last_used ON user_devices(last_used_at);

CREATE INDEX idx_token_device_id ON user_tokens(device_id);

CREATE INDEX idx_token_expires ON user_tokens(expires_at);

CREATE INDEX idx_login_user_uuid ON login_attempts(user_uuid);

CREATE INDEX idx_login_attempt_at ON login_attempts(attempt_at);

CREATE INDEX idx_security_user_uuid ON security_logs(user_uuid);

CREATE INDEX idx_security_event_at ON security_logs(event_at);

CREATE INDEX idx_mfa_user_uuid ON mfa_settings(user_uuid);

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO auth_service;