# rag/ingest.py
# ──────────────────────────────────────────────
# WHAT THIS FILE DOES:
# Takes an uploaded document and:
# 1. Reads the text
# 2. Splits it into small chunks (~200 words)
# 3. Converts each chunk into a "vector" (a list of numbers
#    that represents the meaning of that text)
# 4. Stores those vectors in Pinecone (our vector database)
#
# WHY VECTORS?
# Vectors let us do SEMANTIC search — finding chunks that
# MEAN the same thing as the query, not just share keywords.
# e.g. "card declined overseas" matches "international transaction rejected"
# ──────────────────────────────────────────────

import os
import uuid
from typing import List
from sentence_transformers import SentenceTransformer
from vectorstore import get_pinecone_index

# Load the embedding model once when the module starts
# This model converts text → 384-dimension vector
# "all-MiniLM-L6-v2" is small, fast, and good for English text
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")


def ingest_document(text: str, filename: str) -> dict:
    """
    Main function: takes raw text, chunks it,
    embeds each chunk, stores in Pinecone.
    Returns a summary of what was ingested.
    """
    # Step 1: Split into chunks
    chunks = chunk_text(text, max_words=200)
    print(f"[Ingest] {filename} → {len(chunks)} chunks")

    # Step 2: Convert chunks to vectors (embeddings)
    # encode() processes all chunks at once (batch) for speed
    embeddings = embedding_model.encode(chunks, show_progress_bar=False)

    # Step 3: Store in Pinecone
    index = get_pinecone_index()
    vectors_to_upsert = []

    for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
        vectors_to_upsert.append({
            "id": f"{filename}-chunk-{i}-{uuid.uuid4().hex[:6]}",
            "values": embedding.tolist(),       # the vector (list of floats)
            "metadata": {
                "text": chunk,                  # original text (for display)
                "source": filename,             # which file this came from
                "chunk_index": i                # position in the document
            }
        })

    # Upsert = insert or update. Batch in groups of 100 for efficiency.
    batch_size = 100
    for i in range(0, len(vectors_to_upsert), batch_size):
        index.upsert(vectors=vectors_to_upsert[i:i + batch_size])

    return {
        "filename": filename,
        "chunks": len(chunks),
        "status": "indexed"
    }


def chunk_text(text: str, max_words: int = 200) -> List[str]:
    """
    Split a long document into smaller pieces.

    WHY CHUNK?
    - The AI has a limited context window (can't read 50 pages at once)
    - Smaller chunks = more precise retrieval
    - We split on sentence boundaries to keep meaning intact

    EXAMPLE:
    "Our loan rate is 5%. Interest calculated monthly. Minimum term 12 months."
    → Chunk 1: "Our loan rate is 5%. Interest calculated monthly."
    → Chunk 2: "Minimum term 12 months."
    """
    import re

    # Split on sentence endings (. ! ?) followed by whitespace
    sentences = re.split(r'(?<=[.!?])\s+', text)

    chunks = []
    current_chunk = []
    current_word_count = 0

    for sentence in sentences:
        word_count = len(sentence.split())

        # If adding this sentence exceeds our limit, save current chunk
        if current_word_count + word_count > max_words and current_chunk:
            chunks.append(" ".join(current_chunk))
            current_chunk = []
            current_word_count = 0

        current_chunk.append(sentence)
        current_word_count += word_count

    # Don't forget the last chunk
    if current_chunk:
        chunks.append(" ".join(current_chunk))

    # Remove empty or very short chunks (less than 10 words)
    return [c for c in chunks if len(c.split()) > 10]
