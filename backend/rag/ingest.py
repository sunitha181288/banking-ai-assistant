import uuid, re
from typing import List

def ingest_document(text: str, filename: str) -> dict:
    chunks = chunk_text(text)
    print(f"INFO:     [Ingest] {filename} -> {len(chunks)} chunks")

    from rag.vectorstore import store_chunks
    vectors = [
        {
            "id": f"{filename}-{i}-{uuid.uuid4().hex[:6]}",
            "values": [0.0] * 384,
            "metadata": {"text": chunks[i], "source": filename, "chunk_index": i}
        }
        for i in range(len(chunks))
    ]
    store_chunks(vectors)
    return {"filename": filename, "chunks": len(chunks), "status": "indexed", "mode": "keyword-search"}

def chunk_text(text: str, max_words: int = 200) -> List[str]:
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
    return [c for c in chunks if len(c.split()) > 3]
