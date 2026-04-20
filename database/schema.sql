-- database/schema.sql
-- ──────────────────────────────────────────────
-- WHAT THIS FILE DOES:
-- Creates the PostgreSQL database tables.
-- Docker runs this automatically on first startup.
-- ──────────────────────────────────────────────

-- Conversations table
-- Stores every message for audit trail + memory
CREATE TABLE IF NOT EXISTS conversations (
    id          VARCHAR(36)   PRIMARY KEY,
    session_id  VARCHAR(36)   NOT NULL,
    role        VARCHAR(20)   NOT NULL,        -- 'user' or 'assistant'
    content     TEXT          NOT NULL,
    sources     VARCHAR(500),                  -- RAG source filenames
    created_at  TIMESTAMP     DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_session ON conversations(session_id);

-- Documents table
-- Tracks what has been uploaded to the knowledge base
CREATE TABLE IF NOT EXISTS documents (
    id           VARCHAR(36)   PRIMARY KEY,
    filename     VARCHAR(255)  NOT NULL,
    chunk_count  INTEGER       DEFAULT 0,
    uploaded_at  TIMESTAMP     DEFAULT NOW()
);
