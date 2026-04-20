import os

_memory_store = []

def use_pinecone():
    key = os.getenv("PINECONE_API_KEY", "")
    return bool(key and "your-pinecone-key" not in key)

def store_chunks(vectors):
    if use_pinecone():
        from pinecone import Pinecone, ServerlessSpec
        pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
        index_name = os.getenv("PINECONE_INDEX_NAME", "banking-kb")
        if index_name not in pc.list_indexes().names():
            pc.create_index(name=index_name, dimension=384, metric="cosine",
                spec=ServerlessSpec(cloud="aws", region=os.getenv("PINECONE_ENVIRONMENT","us-east-1")))
        index = pc.Index(index_name)
        for i in range(0, len(vectors), 100):
            index.upsert(vectors=vectors[i:i+100])
    else:
        for v in vectors:
            _memory_store.append({"id": v["id"], "values": v["values"],
                "text": v["metadata"]["text"], "source": v["metadata"]["source"],
                "chunk_index": v["metadata"].get("chunk_index", 0)})
        print(f"INFO:     [Local RAG] {len(_memory_store)} total chunks in memory")

def search_chunks(query_vector, top_k=3, source_filter=None):
    if use_pinecone():
        from pinecone import Pinecone
        pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
        index = pc.Index(os.getenv("PINECONE_INDEX_NAME", "banking-kb"))
        params = {"vector": query_vector, "top_k": top_k, "include_metadata": True}
        if source_filter:
            params["filter"] = {"source": source_filter}
        results = index.query(**params)
        return [{"text": m.metadata.get("text",""), "source": m.metadata.get("source","unknown"),
                 "chunk_index": m.metadata.get("chunk_index",0), "score": round(m.score,3)}
                for m in results.matches]
    else:
        return _local_search(query_vector, top_k, source_filter)

def delete_source(source_name):
    global _memory_store
    if use_pinecone():
        from pinecone import Pinecone
        pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
        pc.Index(os.getenv("PINECONE_INDEX_NAME","banking-kb")).delete(filter={"source": source_name})
    else:
        _memory_store = [c for c in _memory_store if c["source"] != source_name]

def _cosine_similarity(a, b):
    dot = sum(x*y for x,y in zip(a,b))
    mag_a = sum(x*x for x in a) ** 0.5
    mag_b = sum(x*x for x in b) ** 0.5
    return dot / (mag_a * mag_b) if mag_a and mag_b else 0.0

def _local_search(query_vector, top_k, source_filter=None):
    if not _memory_store:
        return []
    candidates = [c for c in _memory_store if not source_filter or c["source"]==source_filter]
    scored = [{**c, "score": round(_cosine_similarity(query_vector, c["values"]), 3)} for c in candidates]
    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored[:top_k]