# agent/loop.py
# ──────────────────────────────────────────────
# WHAT THIS FILE DOES:
# Runs the "agentic loop" — the core of Agentic AI.
#
# THE LOOP:
# 1. Send task to Claude (with tool definitions)
# 2. Claude responds with either:
#    a) Text → task is done, return final answer
#    b) tool_use → Claude wants to call a tool
# 3. If tool_use: execute the tool, feed results back
# 4. Go back to step 2
# 5. Repeat until Claude says it's done (stop_reason = "end_turn")
#
# This is called "agentic" because the AI AUTONOMOUSLY
# decides the sequence of steps — you don't pre-program them.
# ──────────────────────────────────────────────

import os
import anthropic
from typing import AsyncGenerator
from agent.tools import TOOL_DEFINITIONS, execute_tool

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

AGENT_SYSTEM_PROMPT = """You are an intelligent AI agent for NexaBank's contact center operations.

You have access to banking system tools. When given a task:
1. Think about what information you need
2. Use the appropriate tools to gather it
3. Take required actions (flag accounts, create tickets, send notifications)
4. Provide a clear, professional summary of everything you did

Always verify account information before taking security actions.
Be thorough but efficient — use only the tools you actually need.
Communicate findings clearly for both technical staff and customers."""


async def run_agent(task: str, max_iterations: int = 8) -> AsyncGenerator[dict, None]:
    """
    Runs the full agentic loop for a given task.
    
    Uses Python async generator — yields each step as it happens
    so the frontend can show real-time progress.

    Args:
        task: The natural language task to complete
        max_iterations: Safety limit to prevent infinite loops

    Yields:
        dict with 'type', 'content', 'meta' for each step
    """
    messages = [{"role": "user", "content": task}]
    iterations = 0

    yield {"type": "thinking", "content": f"Analysing task: {task}", "meta": "Starting agent"}

    while iterations < max_iterations:
        iterations += 1

        # ── Call Claude with tools ──────────────────
        # We pass all tool definitions so Claude knows what's available
        # Claude will return either text OR tool_use blocks
        response = client.messages.create(
            model="claude-sonnet-4-5",
            max_tokens=1500,
            system=AGENT_SYSTEM_PROMPT,
            tools=TOOL_DEFINITIONS,
            messages=messages
        )

        # Add Claude's full response to message history
        messages.append({"role": "assistant", "content": response.content})

        has_tool_use = False
        tool_results = []

        # ── Process each block in Claude's response ──
        for block in response.content:

            if block.type == "text" and block.text.strip():
                # Claude wrote something — show it
                yield {
                    "type": "thinking",
                    "content": block.text,
                    "meta": f"Iteration {iterations}"
                }

            elif block.type == "tool_use":
                # Claude wants to call a tool
                has_tool_use = True

                yield {
                    "type": "tool_call",
                    "content": f"Calling <strong>{block.name}</strong> with: {block.input}",
                    "meta": f"Tool ID: {block.id}"
                }

                # Execute the tool (calls our simulated banking functions)
                result = execute_tool(block.name, block.input)

                yield {
                    "type": "tool_result",
                    "content": result,
                    "meta": f"Result from {block.name}"
                }

                # Collect result to send back to Claude in next iteration
                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": block.id,
                    "content": str(result)
                })

        # ── Decide what to do next ───────────────────
        if has_tool_use and tool_results:
            # Feed tool results back to Claude and loop
            messages.append({"role": "user", "content": tool_results})
            yield {"type": "thinking", "content": "Processing results, continuing…", "meta": f"Iteration {iterations}"}
            continue

        # No tool calls = Claude is finished
        if response.stop_reason == "end_turn" or not has_tool_use:
            final = " ".join(
                b.text for b in response.content if b.type == "text"
            ).strip()
            if final:
                yield {
                    "type": "done",
                    "content": final,
                    "meta": f"Completed in {iterations} iteration(s)"
                }
            break

    else:
        yield {"type": "error", "content": "Max iterations reached. Task may be incomplete.", "meta": ""}
