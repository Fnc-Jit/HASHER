-- ============================================================
-- HashVault — Supabase Database Schema
-- Run this SQL in your Supabase SQL Editor (supabase.com → project → SQL Editor)
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. Create the main table for storing hash records
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hash_records (
    -- Unique identifier for each record (auto-generated UUID)
    id              UUID            DEFAULT gen_random_uuid()    PRIMARY KEY,

    -- Timestamp of when the hash was created (auto-set to current time)
    created_at      TIMESTAMPTZ     DEFAULT now()               NOT NULL,

    -- Type of input: e.g., "text", "PDF file", "TXT file"
    input_type      TEXT            NOT NULL,

    -- Name or preview of the input (first 50 chars of text, or filename)
    input_name      TEXT,

    -- Hashing algorithm used: SHA-1, SHA-256, SHA-384, SHA-512, MD5
    algorithm       TEXT            NOT NULL,

    -- The resulting hash value (hex string)
    hash_value      TEXT            NOT NULL,

    -- Whether an HMAC secret key was used for this hash
    secret_key_used BOOLEAN         DEFAULT false
);

-- Add comments to the table and each column for documentation
COMMENT ON TABLE  hash_records IS 'Stores all hashing operations performed in HashVault';
COMMENT ON COLUMN hash_records.id IS 'Auto-generated UUID primary key';
COMMENT ON COLUMN hash_records.created_at IS 'Timestamp when the hash was generated';
COMMENT ON COLUMN hash_records.input_type IS 'Type of input: text, PDF file, TXT file, etc.';
COMMENT ON COLUMN hash_records.input_name IS 'First 50 chars of text input, or the filename';
COMMENT ON COLUMN hash_records.algorithm IS 'Hash algorithm: SHA-1, SHA-256, SHA-384, SHA-512, MD5';
COMMENT ON COLUMN hash_records.hash_value IS 'Resulting hash as a hex string';
COMMENT ON COLUMN hash_records.secret_key_used IS 'True if HMAC mode was active during hashing';


-- ─────────────────────────────────────────────────────────────
-- 2. Create indexes for faster queries
-- ─────────────────────────────────────────────────────────────

-- Index on created_at for sorting records chronologically
CREATE INDEX IF NOT EXISTS idx_hash_records_created_at
    ON hash_records (created_at DESC);

-- Index on algorithm for filtering by hash method
CREATE INDEX IF NOT EXISTS idx_hash_records_algorithm
    ON hash_records (algorithm);


-- ─────────────────────────────────────────────────────────────
-- 3. Enable Row Level Security (RLS)
-- ─────────────────────────────────────────────────────────────

-- Enable RLS on the table
ALTER TABLE hash_records ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous users (using the anon key) to INSERT records
CREATE POLICY "Allow anonymous insert"
    ON hash_records
    FOR INSERT
    TO anon
    WITH CHECK (true);

-- Policy: Allow anonymous users to SELECT (read) all records
CREATE POLICY "Allow anonymous select"
    ON hash_records
    FOR SELECT
    TO anon
    USING (true);

-- Policy: Allow anonymous users to DELETE their records
CREATE POLICY "Allow anonymous delete"
    ON hash_records
    FOR DELETE
    TO anon
    USING (true);


-- ─────────────────────────────────────────────────────────────
-- 4. Realtime Broadcast Trigger
--    Broadcasts INSERT/UPDATE/DELETE changes to the
--    'hash_records' realtime topic for live UI updates.
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION hash_records_broadcast_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    PERFORM realtime.broadcast_changes(
        'hash_records',        -- topic
        TG_OP,                 -- operation (INSERT, UPDATE, DELETE)
        TG_TABLE_NAME,         -- table name
        TG_TABLE_SCHEMA,       -- schema
        to_jsonb(NEW),         -- new row payload
        to_jsonb(OLD)          -- old row payload
    );
    RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER hash_records_broadcast_trigger
    AFTER INSERT OR UPDATE OR DELETE
    ON hash_records
    FOR EACH ROW
    EXECUTE FUNCTION hash_records_broadcast_trigger();


-- ─────────────────────────────────────────────────────────────
-- 5. Aggregated stats view
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW hash_stats AS
SELECT
    algorithm,
    COUNT(*)                                    AS total_hashes,
    COUNT(*) FILTER (WHERE secret_key_used)     AS hmac_count,
    MIN(created_at)                             AS first_hash,
    MAX(created_at)                             AS last_hash
FROM hash_records
GROUP BY algorithm
ORDER BY total_hashes DESC;

COMMENT ON VIEW hash_stats IS 'Aggregated statistics grouped by hash algorithm';

-- Grant access to the stats view for anon role
GRANT SELECT ON hash_stats TO anon;


-- ============================================================
-- Done! Your HashVault database is ready.
--
-- Next steps:
-- 1. Go to your Supabase project → Settings → API
-- 2. Copy the "Project URL" and "anon public" key
-- 3. Paste them into HashVault → Settings → Supabase Connection
-- 4. Click "Test Connection" to verify
--
-- Security notes:
-- • The RLS policies above are fully permissive for the anon role.
--   For production, scope policies to authenticated users.
-- • The trigger function uses SECURITY DEFINER. Consider revoking
--   direct EXECUTE from public if not needed externally.
-- • Use private channels and RLS on realtime.messages for
--   production realtime security.
-- ============================================================
