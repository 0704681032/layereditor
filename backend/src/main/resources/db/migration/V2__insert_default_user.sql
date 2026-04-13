-- Default user for development.
-- Password hash is configured via Flyway placeholder 'defaultUserPasswordHash'.
INSERT INTO app_user (username, password_hash)
VALUES ('editor', '${defaultUserPasswordHash}');
