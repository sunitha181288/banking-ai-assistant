# api/chat.py
# ──────────────────────────────────────────────
# WHAT THIS FILE DOES:
# Defines the API endpoints for the chat feature.
# The frontend sends HTTP POST requests here.
# We handle RAG retrieval and call Claude.
# ──────────────────────────────────────────────

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
client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))


# ── REQUEST / RESPONSE MODELS ──────────────────
# Pydantic models define the shape of request/response data
# FastAPI automatically validates incoming data against these

class ChatMessage(BaseModel):
    role: str       # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    message: str
    session_id: str
    history: List[ChatMessage] = []    # previous messages for memory
    persona: Optional[str] = "professional"
    tone: Optional[str] = "professional"
    use_rag: bool = True

class ChatResponse(BaseModel):
    reply: str
    sources: List[str] = []
    rag_chunks_used: int = 0


# ── ENDPOINTS ─────────────────────────────────

@router.post("/message", response_model=ChatResponse)
async def send_message(request: ChatRequest, db: Session = Depends(get_db)):
    """
    Main chat endpoint.
    1. Retrieve relevant document chunks (RAG)
    2. Build system prompt (prompt tuning)
    3. Call Claude with history + context (memory)
    4. Store conversation in DB
    5. Return response with sources
    """
    # ── STEP 1: RAG Retrieval ──────────────────
    sources = []
    context_block = ""
    chunks_used = 0

    if request.use_rag:
        chunks = retrieve_relevant_chunks(request.message, top_k=3)
        if chunks:
            context_block = build_context_block(chunks)
            sources = list(set(c["source"] for c in chunks))
            chunks_used = len(chunks)

    # ── STEP 2: Build System Prompt (Prompt Tuning) ──
    system_prompt = _build_system_prompt(request.persona, request.tone, bool(context_block))

    # ── STEP 3: Build Messages with Memory ────────
    # Include conversation history so Claude remembers previous turns
    messages = [
        {"role": m.role, "content": m.content}
        for m in request.history[-10:]  # last 10 turns to manage token cost
    ]
    # Add current message with RAG context appended
    user_content = request.message + (context_block if context_block else "")
    messages.append({"role": "user", "content": user_content})

    # ── STEP 4: Call Claude ─────────────────────
    try:
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1000,
            system=system_prompt,
            messages=messages
        )
        reply = response.content[0].text
    except anthropic.APIError as e:
        raise HTTPException(status_code=500, detail=str(e))

    # ── STEP 5: Store in Database ───────────────
    # Save both user message and AI reply for audit trail
    db.add(Conversation(
        session_id=request.session_id,
        role="user",
        content=request.message,
        sources=",".join(sources)
    ))
    db.add(Conversation(
        session_id=request.session_id,
        role="assistant",
        content=reply
    ))
    db.commit()

    return ChatResponse(reply=reply, sources=sources, rag_chunks_used=chunks_used)


@router.get("/history/{session_id}")
def get_history(session_id: str, db: Session = Depends(get_db)):
    """Retrieve conversation history for a session."""
    messages = db.query(Conversation)\
        .filter(Conversation.session_id == session_id)\
        .order_by(Conversation.created_at)\
        .all()
    return [{"role": m.role, "content": m.content, "sources": m.sources} for m in messages]


@router.delete("/history/{session_id}")
def clear_history(session_id: str, db: Session = Depends(get_db)):
    """Clear conversation history for a session."""
    db.query(Conversation).filter(Conversation.session_id == session_id).delete()
    db.commit()
    return {"status": "cleared"}


# ── PROMPT BUILDING ────────────────────────────
# This is the Prompt Tuning logic — different personas
# and tones produce different system prompts

PERSONAS = {
    "formal": "You are a formal, authoritative bank officer. Use professional language, avoid contractions.",
    "friendly": "You are a warm, friendly customer support agent named Alex. Use empathetic, approachable language.",
    "expert": "You are a senior financial expert with 20 years of banking experience. Provide detailed, precise answers.",
    "concise": "You are a concise FAQ bot. Give the shortest possible accurate answer. No pleasantries.",
    "empathetic": "You are an empathetic complaints handler. Always acknowledge frustration first, then resolve."
}

TONES = {
    "professional": "Maintain a professional, measured tone.",
    "warm": "Use a warm, reassuring tone that makes customers feel valued.",
    "direct": "Be direct and to the point. No fluff.",
    "educational": "Explain clearly as if the customer may not know banking terms."
}


def _build_system_prompt(persona: str, tone: str, has_rag: bool) -> str:
    persona_text = PERSONAS.get(persona, PERSONAS["friendly"])
    tone_text = TONES.get(tone, TONES["professional"])
    rag_instruction = (
        "You have been provided relevant document excerpts. Use them to answer accurately and cite your sources."
        if has_rag else
        "No documents loaded. Answer from general banking knowledge and suggest the customer contact the bank for specific details."
    )
    return f"{persona_text}\n\nTone: {tone_text}\n\n{rag_instruction}\n\nNever invent account numbers, rates, or policies. If unsure, say so."
