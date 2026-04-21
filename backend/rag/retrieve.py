from typing import List, Dict
from rag.vectorstore import _memory_store

def retrieve_relevant_chunks(query: str, top_k: int = 3, source_filter: str = None) -> List[Dict]:
    return _keyword_search(query, top_k, source_filter)

def _keyword_search(query: str, top_k: int, source_filter: str = None) -> List[Dict]:
    if not _memory_store:
        return []
    stop = {
        'what','when','where','which','that','this','have','with','from',
        'your','does','will','about','their','how','the','and','for','are',
        'can','you','my','is','do','to','a','an','in','of','i','me','we'
    }
    qwords = set(
        w.lower() for w in query.replace('?','').replace(',','').split()
        if len(w) > 2 and w.lower() not in stop
    )
    if not qwords:
        return _memory_store[:top_k]

    candidates = [c for c in _memory_store if not source_filter or c["source"] == source_filter]
    scored = []
    for chunk in candidates:
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

def build_context_block(chunks: List[Dict]) -> str:
    if not chunks:
        return ""
    ctx = "\n\nRELEVANT DOCUMENT CONTEXT:\n" + "=" * 40 + "\n"
    for c in chunks:
        ctx += f"\n[Source: {c['source']} | Relevance: {c['score']}]\n{c['text']}\n"
    return ctx + "=" * 40 + "\n"
