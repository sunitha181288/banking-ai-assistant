# main.py — FastAPI entry point
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.chat import router as chat_router
from api.documents import router as documents_router
from api.agent import router as agent_router
from database import engine, Base

# Create tables on startup (works for both SQLite and PostgreSQL)
# SQLite: creates nexabank.db file if it doesn't exist
# PostgreSQL: creates tables in your Postgres database
try:
    Base.metadata.create_all(bind=engine)
    print("INFO:     Database tables ready ✅")
except Exception as e:
    print(f"WARNING:  Could not create DB tables: {e}")
    print("WARNING:  App will start but conversation history won't be saved")

app = FastAPI(
    title="NexaBank AI API",
    description="Banking Contact Center AI — RAG + Prompt Tuning + Agentic AI",
    version="2.0.0"
)

# CORS: allows the frontend (localhost:3000) to call this backend (localhost:8000)
# Without this, browsers block cross-origin requests for security
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register the 3 feature routers
app.include_router(chat_router,      prefix="/api/chat",      tags=["Chat + RAG"])
app.include_router(documents_router, prefix="/api/documents", tags=["Document Upload"])
app.include_router(agent_router,     prefix="/api/agent",     tags=["Agentic AI"])

@app.get("/")
def health_check():
    return {"status": "online", "service": "NexaBank AI API", "version": "2.0.0"}
