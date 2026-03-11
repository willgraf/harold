-- Add email verification columns to the signups table
ALTER TABLE signups ADD COLUMN verification_token TEXT;
ALTER TABLE signups ADD COLUMN verification_token_expiry TIMESTAMPTZ;
ALTER TABLE signups ADD COLUMN verified BOOLEAN;

-- Partial index for token lookups (only unverified rows have tokens we need to find)
CREATE INDEX idx_signups_verification_token
  ON signups (verification_token)
  WHERE verification_token IS NOT NULL;
