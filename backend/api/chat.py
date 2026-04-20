import os
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session
import anthropic

from database import get_db
from models import Conversation
from rag.retrieve import retrieve_relevant_chunks, build_context_block

router = APIRouter()

def get_client():
    key = os.getenv("ANTHROPIC_API_KEY", "")
    if not key:
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY not set in backend/.env")
    return anthropic.Anthropic(api_key=key)

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

@router.post("/message", response_model=ChatResponse)
async def send_message(request: ChatRequest, db: Session = Depends(get_db)):
    # RAG retrieval
    sources, context_block, chunks_used = [], "", 0
    if request.use_rag:
        try:
            chunks = retrieve_relevant_chunks(request.message, top_k=3)
            if chunks:
                context_block = build_context_block(chunks)
                sources = list(set(c["source"] for c in chunks))
                chunks_used = len(chunks)
        except Exception as e:
            print(f"WARNING: RAG failed: {e}")

    # Build system prompt
    system_prompt = _build_system_prompt(request.persona, request.tone, bool(context_block))

    # Build messages with history (memory)
    messages = [{"role": m.role, "content": m.content} for m in request.history[-10:]]
    messages.append({"role": "user", "content": request.message + context_block})

    # Call Claude — client created HERE so dotenv is already loaded
    try:
        client = get_client()
        response = client.messages.create(
            model="claude-sonnet-4-5",
            max_tokens=1000,
            system=system_prompt,
            messages=messages
        )
        reply = response.content[0].text
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Claude API error: {str(e)}")

    # Save to DB
    try:
        db.add(Conversation(session_id=request.session_id, role="user",
                            content=request.message, sources=",".join(sources)))
        db.add(Conversation(session_id=request.session_id, role="assistant", content=reply))
        db.commit()
    except Exception as e:
        print(f"WARNING: DB save failed: {e}")

    return ChatResponse(reply=reply, sources=sources, rag_chunks_used=chunks_used)

@router.get("/history/{session_id}")
def get_history(session_id: str, db: Session = Depends(get_db)):
    msgs = db.query(Conversation).filter(Conversation.session_id == session_id)\
               .order_by(Conversation.created_at).all()
    return [{"role": m.role, "content": m.content, "sources": m.sources} for m in msgs]

@router.delete("/history/{session_id}")
def clear_history(session_id: str, db: Session = Depends(get_db)):
    db.query(Conversation).filter(Conversation.session_id == session_id).delete()
    db.commit()
    return {"status": "cleared"}

PERSONAS = {
    "formal":     "You are a formal, authoritative bank officer. Use professional language.",
    "friendly":   "You are a warm, friendly customer support agent named Alex.",
    "expert":     "You are a senior financial expert with 20 years of banking experience.",
    "concise":    "You are a concise FAQ bot. Give the shortest possible accurate answer.",
    "empathetic": "You are an empathetic complaints handler. Acknowledge frustration first.",
}
TONES = {
    "professional": "Maintain a professional, measured tone.",
    "warm":         "Use a warm, reassuring tone that makes customers feel valued.",
    "direct":       "Be direct and to the point. No fluff.",
    "educational":  "Explain clearly as if the customer may not know banking terms.",
}

def _build_system_prompt(persona, tone, has_rag):
    p = PERSONAS.get(persona, PERSONAS["friendly"])
    t = TONES.get(tone, TONES["professional"])
    r = ("You have relevant document excerpts above. Use them and cite the source."
         if has_rag else
         "No documents loaded. Use general banking knowledge.")
    return f"{p}\n\nTone: {t}\n\n{r}\n\nNever invent account numbers, rates, or policies."
