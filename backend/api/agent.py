# api/agent.py
# ──────────────────────────────────────────────
# WHAT THIS FILE DOES:
# API endpoint for the Agentic AI feature.
# Uses Server-Sent Events (SSE) to stream
# each agent step to the frontend in real time —
# so the user sees the agent "thinking" live.
# ──────────────────────────────────────────────

import json
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from agent.loop import run_agent

router = APIRouter()


class AgentRequest(BaseModel):
    task: str


@router.post("/run")
async def run_agent_task(request: AgentRequest):
    """
    Run an agentic task and stream each step back to the frontend.

    Uses SSE (Server-Sent Events) — a way to push data from
    server to browser in real time without WebSockets.

    The frontend receives each step as it happens:
    - thinking → planning step
    - tool_call → about to call a tool
    - tool_result → result from tool
    - done → final answer
    - error → something went wrong
    """
    async def event_stream():
        async for step in run_agent(request.task):
            # Format as SSE: "data: {json}\n\n"
            # The frontend listens for these events
            yield f"data: {json.dumps(step)}\n\n"
        # Signal the stream is complete
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no"  # disable nginx buffering for real-time
        }
    )
