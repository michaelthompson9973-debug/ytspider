-- Add wildcard support to allowed_domains table
ALTER TABLE allowed_domains
ADD COLUMN is_wildcard boolean NOT NULL DEFAULT false;

-- Add constraint: wildcard domains must start with *.
ALTER TABLE allowed_domains
ADD CONSTRAINT wildcard_format_check 
CHECK (
  (is_wildcard = false) OR 
  (is_wildcard = true AND domain LIKE '*.%')
);