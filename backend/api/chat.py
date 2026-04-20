import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import anthropic
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    session_id: str
    history: List[ChatMessage] = []
    persona: Optional[str] = "friendly"
    tone: Optional[str] = "professional"
    use_rag: bool = True

class ChatResponse(BaseModel):
    reply: str
    sources: List[str] = []
    rag_chunks_used: int = 0

PERSONAS = {
    "formal":     "You are a formal bank officer. Use professional language.",
    "friendly":   "You are a warm friendly customer support agent named Alex.",
    "expert":     "You are a senior financial expert with 20 years experience.",
    "concise":    "You are a concise FAQ bot. Give shortest possible accurate answer.",
    "empathetic": "You are an empathetic complaints handler. Acknowledge frustration first.",
}
TONES = {
    "professional": "Maintain a professional measured tone.",
    "warm":         "Use a warm reassuring tone.",
    "direct":       "Be direct and to the point.",
    "educational":  "Explain clearly for someone unfamiliar with banking.",
}

@router.post("/message", response_model=ChatResponse)
async def send_message(request: ChatRequest):
    # Step 1: RAG retrieval
    sources, context_block, chunks_used = [], "", 0
    if request.use_rag:
        try:
            from rag.retrieve import retrieve_relevant_chunks, build_context_block
            chunks = retrieve_relevant_chunks(request.message, top_k=3)
            if chunks:
                context_block = build_context_block(chunks)
                sources = list(set(c["source"] for c in chunks))
                chunks_used = len(chunks)
        except Exception as e:
            print(f"WARNING: RAG failed (non-fatal): {e}")

    # Step 2: Build system prompt
    persona = PERSONAS.get(request.persona, PERSONAS["friendly"])
    tone    = TONES.get(request.tone, TONES["professional"])
    rag_instruction = (
        "Use the document context above to answer. Cite which document you used."
        if context_block else
        "No documents loaded. Answer from general banking knowledge."
    )
    system = f"{persona}\n\nTone: {tone}\n\n{rag_instruction}\n\nNever invent specific rates or account numbers."

    # Step 3: Build messages
    messages = [{"role": m.role, "content": m.content} for m in request.history[-10:]]
    messages.append({"role": "user", "content": request.message + context_block})

    # Step 4: Call Claude
    api_key = os.getenv("ANTHROPIC_API_KEY", "")
    if not api_key:
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY not set in .env")

    client = anthropic.Anthropic(api_key=api_key)
    response = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=1000,
        system=system,
        messages=messages
    )
    reply = response.content[0].text

    # Step 5: Save to DB (optional — skip if DB not available)
    try:
        from database import SessionLocal
        from models import Conversation
        db = SessionLocal()
        db.add(Conversation(session_id=request.session_id, role="user",
                            content=request.message, sources=",".join(sources)))
        db.add(Conversation(session_id=request.session_id, role="assistant",
                            content=reply))
        db.commit()
        db.close()
    except Exception as e:
        print(f"WARNING: DB save skipped: {e}")

    return ChatResponse(reply=reply, sources=sources, rag_chunks_used=chunks_used)

@router.get("/history/{session_id}")
def get_history(session_id: str):
    try:
        from database import SessionLocal
        from models import Conversation
        db = SessionLocal()
        msgs = db.query(Conversation)\
                  .filter(Conversation.session_id == session_id)\
                  .order_by(Conversation.created_at).all()
        db.close()
        return [{"role": m.role, "content": m.content} for m in msgs]
    except Exception:
        return []

@router.delete("/history/{session_id}")
def clear_history(session_id: str):
    try:
        from database import SessionLocal
        from models import Conversation
        db = SessionLocal()
        db.query(Conversation).filter(Conversation.session_id == session_id).delete()
        db.commit()
        db.close()
    except Exception:
        pass
    return {"status": "cleared"}
