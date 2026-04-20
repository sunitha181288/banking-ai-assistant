# api/documents.py
# ──────────────────────────────────────────────
# WHAT THIS FILE DOES:
# Handles document upload from the frontend.
# Accepts .txt, .pdf, .md files,
# extracts the text, and passes to the RAG pipeline.
# ──────────────────────────────────────────────

from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List
import io

from rag.ingest import ingest_document

router = APIRouter()


@router.post("/upload")
async def upload_document(files: List[UploadFile] = File(...)):
    """
    Upload one or more documents to the knowledge base.
    Supports .txt, .pdf, .md files.
    Returns chunk count for each file.
    """
    results = []

    for file in files:
        # Validate file type
        allowed = [".txt", ".pdf", ".md"]
        if not any(file.filename.endswith(ext) for ext in allowed):
            raise HTTPException(
                status_code=400,
                detail=f"File type not supported: {file.filename}. Use .txt, .pdf, or .md"
            )

        # Read file content
        content = await file.read()

        # Extract text based on file type
        if file.filename.endswith(".pdf"):
            text = _extract_pdf_text(content)
        else:
            # .txt and .md are plain text
            text = content.decode("utf-8", errors="ignore")

        if not text.strip():
            raise HTTPException(status_code=400, detail=f"Could not extract text from {file.filename}")

        # Ingest into RAG pipeline (chunk + embed + store in Pinecone)
        result = ingest_document(text, file.filename)
        results.append(result)

    return {"uploaded": len(results), "documents": results}


@router.delete("/{filename}")
def delete_document(filename: str):
    """
    Remove a document from the knowledge base.
    Deletes all vectors for this source from Pinecone.
    """
    from rag.vectorstore import get_pinecone_index
    index = get_pinecone_index()

    # Delete all vectors where source metadata matches filename
    index.delete(filter={"source": filename})
    return {"status": "deleted", "filename": filename}


@router.get("/list")
def list_documents():
    """List all documents currently in the knowledge base."""
    from rag.vectorstore import get_pinecone_index
    index = get_pinecone_index()
    stats = index.describe_index_stats()
    return {
        "total_vectors": stats.total_vector_count,
        "index_fullness": stats.index_fullness
    }


def _extract_pdf_text(content: bytes) -> str:
    """
    Extract plain text from a PDF file.
    Uses PyMuPDF (fitz) — install with: pip install pymupdf
    """
    try:
        import fitz  # PyMuPDF
        doc = fitz.open(stream=content, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text()
        return text
    except ImportError:
        raise HTTPException(
            status_code=500,
            detail="PDF support requires PyMuPDF. Install with: pip install pymupdf"
        )
