# rag/vectorstore.py
# ──────────────────────────────────────────────
# WHAT THIS FILE DOES:
# Manages the connection to Pinecone — our vector database.
#
# WHAT IS A VECTOR DATABASE?
# A regular database stores text, numbers, dates.
# A vector database stores VECTORS (lists of numbers)
# and can find which vectors are mathematically "close"
# to each other — meaning their original text is similar in meaning.
#
# Pinecone is a managed cloud vector database —
# we don't need to host it ourselves.
# ──────────────────────────────────────────────

import os
from pinecone import Pinecone, ServerlessSpec

# Module-level variable — connection is created once and reused
_pinecone_index = None


def get_pinecone_index():
    """
    Returns a Pinecone index connection.
    Uses module-level caching so we don't reconnect on every request.
    """
    global _pinecone_index

    if _pinecone_index is not None:
        return _pinecone_index

    # Initialise Pinecone with API key from environment
    pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))

    index_name = os.getenv("PINECONE_INDEX_NAME", "banking-kb")

    # Create the index if it doesn't exist yet
    # dimension=384 must match our embedding model output size
    # metric="cosine" measures similarity between vectors (0=different, 1=identical)
    if index_name not in pc.list_indexes().names():
        pc.create_index(
            name=index_name,
            dimension=384,          # all-MiniLM-L6-v2 produces 384-dim vectors
            metric="cosine",
            spec=ServerlessSpec(
                cloud="aws",
                region=os.getenv("PINECONE_ENVIRONMENT", "us-east-1")
            )
        )
        print(f"[Pinecone] Created new index: {index_name}")

    _pinecone_index = pc.Index(index_name)
    print(f"[Pinecone] Connected to index: {index_name}")
    return _pinecone_index
