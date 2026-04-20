import os, uuid, re
from typing import List
from rag.vectorstore import store_chunks, use_pinecone

try:
    from sentence_transformers import SentenceTransformer
    _model = SentenceTransformer("all-MiniLM-L6-v2")
    _use_embeddings = True
    print("INFO:     [RAG] Using sentence-transformer embeddings")
except Exception:
    _model = None
    _use_embeddings = False
    print("WARNING:  [RAG] Using keyword search fallback")

def ingest_document(text, filename):
    chunks = chunk_text(text)
    print(f"INFO:     [Ingest] {filename} → {len(chunks)} chunks")
    if _use_embeddings:
        embeddings = _model.encode(chunks, show_progress_bar=False)
        vectors = [{"id": f"{filename}-{i}-{uuid.uuid4().hex[:6]}", "values": embeddings[i].tolist(),
                    "metadata": {"text": chunks[i], "source": filename, "chunk_index": i}} for i in range(len(chunks))]
    else:
        vectors = [{"id": f"{filename}-{i}-{uuid.uuid4().hex[:6]}", "values": [0.0]*384,
                    "metadata": {"text": chunks[i], "source": filename, "chunk_index": i}} for i in range(len(chunks))]
    store_chunks(vectors)
    return {"filename": filename, "chunks": len(chunks), "status": "indexed",
            "mode": "pinecone" if use_pinecone() else "local-memory"}

def chunk_text(text, max_words=200):
    sentences = re.split(r'(?<=[.!?])\s+', text)
    chunks, current, wc = [], [], 0
    for s in sentences:
        w = len(s.split())
        if wc + w > max_words and current:
            chunks.append(" ".join(current))
            current, wc = [], 0
        current.append(s)
        wc += w
    if current:
        chunks.append(" ".join(current))
    return [c for c in chunks if len(c.split()) > 10]