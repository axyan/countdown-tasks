CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
  id UUID DEFAULT uuid_generate_v4(),
  email VARCHAR(254) NOT NULL CONSTRAINT rfc_invalid_long_email CHECK (LENGTH(email) <= 254), -- RFC 2821 implies 254 characters max for email length
  password BYTEA NOT NULL, -- Bcrypt hash stored in binary
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE(email)
);
