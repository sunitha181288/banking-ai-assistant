from typing import List, Dict
from rag.vectorstore import search_chunks, _memory_store

# Lazy load — don't load at startup
_model = None
_use_embeddings = None

def get_model():
    global _model, _use_embeddings
    if _use_embeddings is not None:
        return _model, _use_embeddings
    try:
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer("all-MiniLM-L6-v2")
        _use_embeddings = True
    except Exception:
        _model = None
        _use_embeddings = False
    return _model, _use_embeddings

def retrieve_relevant_chunks(query, top_k=3, source_filter=None):
    model, use_emb = get_model()
    if use_emb and model:
        query_vector = model.encode(query).tolist()
        return search_chunks(query_vector, top_k, source_filter)
    return _keyword_search(query, top_k)

def _keyword_search(query, top_k):
    if not _memory_store:
        return []
    stop = {'what','when','where','which','that','this','have','with','from',
            'your','does','will','about','their','how','the','and','for',
            'are','can','you','my','is','do','to','a','an','in','of'}
    qwords = set(
        w.lower() for w in query.replace('?','').replace(',','').split()
        if len(w) > 3 and w.lower() not in stop
    )
    if not qwords:
        return _memory_store[:top_k]

    scored = []
    for chunk in _memory_store:
        cwords = chunk["text"].lower().split()
        score = sum(1 for q in qwords for c in cwords if q in c or c in q)
        if score > 0:
            scored.append({
                "text":        chunk["text"],
                "source":      chunk["source"],
                "chunk_index": chunk["chunk_index"],
                "score":       round(score / max(len(qwords), 1), 3)
            })
    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored[:top_k]

def build_context_block(chunks):
    if not chunks:
        return ""
    ctx = "\n\nRELEVANT DOCUMENT CONTEXT:\n" + "=" * 40 + "\n"
    for c in chunks:
        ctx += f"\n[Source: {c['source']} | Relevance: {c['score']}]\n{c['text']}\n"
    return ctx + "=" * 40 + "\n"
