# database.py
# ──────────────────────────────────────────────
# UPDATED: Uses SQLite by default for local dev.
# SQLite = simple file database, zero setup needed.
# PostgreSQL = full server, used in production.
# ──────────────────────────────────────────────

import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "")

# If no real DB URL set, use SQLite (creates nexabank.db file automatically)
if not DATABASE_URL or "user:password" in DATABASE_URL:
    print("INFO:     Using SQLite for local dev — no PostgreSQL needed")
    DATABASE_URL = "sqlite:///./nexabank.db"
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False}  # required for SQLite + FastAPI
    )
else:
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """Provides a DB session per request, closes it after."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
