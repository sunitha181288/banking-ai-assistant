import os
from fastapi import APIRouter, UploadFile, File, HTTPException, Request
from fastapi.responses import JSONResponse
from typing import List
from rag.ingest import ingest_document
from rag.vectorstore import delete_source, use_pinecone

router = APIRouter()

# Handle preflight OPTIONS request explicitly
@router.options("/upload")
async def upload_options():
    return JSONResponse(
        content={},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "*",
        }
    )

@router.post("/upload")
async def upload_document(files: List[UploadFile] = File(...)):
    results = []
    for file in files:
        allowed = [".txt", ".pdf", ".md"]
        if not any(file.filename.lower().endswith(ext) for ext in allowed):
            raise HTTPException(
                status_code=400,
                detail=f"File type not supported: {file.filename}. Use .txt, .pdf, or .md"
            )
        content = await file.read()
        if file.filename.lower().endswith(".pdf"):
            text = _extract_pdf_text(content)
        else:
            text = content.decode("utf-8", errors="ignore")

        if not text.strip():
            raise HTTPException(
                status_code=400,
                detail=f"Could not extract text from {file.filename}"
            )
        result = ingest_document(text, file.filename)
        results.append(result)

    return JSONResponse(
        content={"uploaded": len(results), "documents": results},
        headers={"Access-Control-Allow-Origin": "*"}
    )

@router.delete("/{filename}")
def delete_document(filename: str):
    delete_source(filename)
    return {"status": "deleted", "filename": filename}

@router.get("/list")
def list_documents():
    if use_pinecone():
        from rag.vectorstore import get_pinecone_index
        stats = get_pinecone_index().describe_index_stats()
        return {"storage": "pinecone", "total_vectors": stats.total_vector_count}
    else:
        from rag.vectorstore import _memory_store
        sources = list(set(c["source"] for c in _memory_store))
        return {"storage": "local-memory", "total_chunks": len(_memory_store), "documents": sources}

def _extract_pdf_text(content: bytes) -> str:
    try:
        import fitz
        doc = fitz.open(stream=content, filetype="pdf")
        return "".join(page.get_text() for page in doc)
    except ImportError:
        raise HTTPException(
            status_code=500,
            detail="PDF support requires PyMuPDF. Run: pip install pymupdf"
        )
