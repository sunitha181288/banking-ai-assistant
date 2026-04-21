import os
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.chat import router as chat_router
from api.documents import router as documents_router
from api.agent import router as agent_router
from database import engine, Base

try:
    Base.metadata.create_all(bind=engine)
    print("INFO:     Database tables ready")
except Exception as e:
    print(f"WARNING:  Could not create DB tables: {e}")

app = FastAPI(
    title="NexaBank AI API",
    description="Banking Contact Center AI — RAG + Prompt Tuning + Agentic AI",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://banking-ai-assistant.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router,      prefix="/api/chat",      tags=["Chat + RAG"])
app.include_router(documents_router, prefix="/api/documents", tags=["Document Upload"])
app.include_router(agent_router,     prefix="/api/agent",     tags=["Agentic AI"])

@app.get("/")
def health_check():
    return {
        "status": "online",
        "anthropic_key_loaded": bool(os.getenv("ANTHROPIC_API_KEY")),
        "version": "2.0.0"
    }
