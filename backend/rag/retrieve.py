# rag/retrieve.py
# ──────────────────────────────────────────────
# WHAT THIS FILE DOES:
# Given a user's question, finds the most relevant
# document chunks from Pinecone using semantic search.
#
# HOW SEMANTIC SEARCH WORKS:
# 1. Convert the question to a vector (same model used in ingest)
# 2. Ask Pinecone: "which stored vectors are closest to this?"
# 3. Return the top K most similar chunks
#
# SEMANTIC vs KEYWORD search:
# Keyword: "loan rate" only matches text containing those exact words
# Semantic: "loan rate" also matches "borrowing interest percentage"
#           because they MEAN the same thing in vector space
# ──────────────────────────────────────────────

from typing import List, Dict
from sentence_transformers import SentenceTransformer
from vectorstore import get_pinecone_index

# Use the SAME embedding model as ingest — critical!
# If you embed with model A and search with model B, results are meaningless
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")


def retrieve_relevant_chunks(
    query: str,
    top_k: int = 3,
    source_filter: str = None
) -> List[Dict]:
    """
    Find the top_k most relevant document chunks for a query.

    Args:
        query: The user's question
        top_k: How many chunks to return (3 is usually enough)
        source_filter: Optionally limit to one document

    Returns:
        List of dicts with 'text', 'source', 'score'
    """
    # Step 1: Convert query to vector
    # This is the same process as ingestion — same model, same dimensions
    query_vector = embedding_model.encode(query).tolist()

    # Step 2: Search Pinecone for similar vectors
    # include_metadata=True means return the original text alongside the vector
    index = get_pinecone_index()

    search_params = {
        "vector": query_vector,
        "top_k": top_k,
        "include_metadata": True
    }

    # Optionally filter by source document
    if source_filter:
        search_params["filter"] = {"source": source_filter}

    results = index.query(**search_params)

    # Step 3: Format and return results
    chunks = []
    for match in results.matches:
        chunks.append({
            "text": match.metadata.get("text", ""),
            "source": match.metadata.get("source", "unknown"),
            "chunk_index": match.metadata.get("chunk_index", 0),
            "score": round(match.score, 3)  # similarity score 0-1
        })

    return chunks


def build_context_block(chunks: List[Dict]) -> str:
    """
    Format retrieved chunks into a text block
    that gets injected into the AI's prompt.

    Example output:
    [Source: loan_policy.txt]
    Our personal loan rates start at 5.5% p.a...

    [Source: faq.txt]
    To apply for a loan, visit any branch with...
    """
    if not chunks:
        return ""

    context = "\n\nRELEVANT DOCUMENT CONTEXT:\n"
    context += "=" * 40 + "\n"

    for chunk in chunks:
        context += f"\n[Source: {chunk['source']} | Relevance: {chunk['score']}]\n"
        context += chunk["text"] + "\n"

    context += "=" * 40 + "\n"
    return context
