CREATE TABLE IF NOT EXISTS crate_blob (
  id TEXT PRIMARY KEY,
  json TEXT NOT NULL
);

-- Logical documents stored inside crate_blob.json:
-- shelves, paired devices (secret hashes only), and five-minute pairing codes.
