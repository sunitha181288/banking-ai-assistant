# models.py
# ──────────────────────────────────────────────
# WHAT THIS FILE DOES:
# Defines database tables as Python classes.
# SQLAlchemy converts these into actual SQL tables.
#
# Each class = one database table
# Each attribute = one column
# ──────────────────────────────────────────────

from sqlalchemy import Column, String, Text, DateTime, Integer
from sqlalchemy.sql import func
import uuid
from database import Base


class Conversation(Base):
    """
    Stores every message in every conversation.
    Used for: conversation history, audit trail, analytics.

    SQL equivalent:
    CREATE TABLE conversations (
        id VARCHAR PRIMARY KEY,
        session_id VARCHAR,
        role VARCHAR,
        content TEXT,
        sources VARCHAR,
        created_at TIMESTAMP
    );
    """
    __tablename__ = "conversations"

    id         = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String, nullable=False, index=True)   # groups messages into conversations
    role       = Column(String, nullable=False)               # "user" or "assistant"
    content    = Column(Text, nullable=False)                 # the message text
    sources    = Column(String, nullable=True)                # RAG source filenames (comma-separated)
    created_at = Column(DateTime, server_default=func.now())  # auto-set timestamp


class Document(Base):
    """
    Tracks uploaded documents in the knowledge base.

    SQL equivalent:
    CREATE TABLE documents (
        id VARCHAR PRIMARY KEY,
        filename VARCHAR,
        chunk_count INTEGER,
        uploaded_at TIMESTAMP
    );
    """
    __tablename__ = "documents"

    id           = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    filename     = Column(String, nullable=False)
    chunk_count  = Column(Integer, default=0)
    uploaded_at  = Column(DateTime, server_default=func.now())
