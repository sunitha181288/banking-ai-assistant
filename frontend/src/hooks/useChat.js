// hooks/useChat.js
// ──────────────────────────────────────────────
// WHAT THIS FILE DOES:
// A React "hook" — a reusable piece of state logic.
// Manages all the chat state: messages, loading, history.
// Any component that imports this hook gets chat functionality.
//
// WHY A HOOK?
// Instead of repeating the same state logic in every component,
// we put it here once and reuse it everywhere.
// ──────────────────────────────────────────────

import { useState, useCallback } from "react";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export function useChat() {
  const [messages, setMessages] = useState([]);      // all messages shown in UI
  const [history, setHistory]   = useState([]);      // conversation history for API
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => uuidv4());      // unique session ID per browser tab

  /**
   * Send a message and get an AI response.
   * Updates both the UI messages and the API history.
   */
  const sendMessage = useCallback(async (text, options = {}) => {
    if (!text.trim() || isLoading) return;

    const userMsg = { role: "user", content: text, id: uuidv4() };

    // Add user message to UI immediately (don't wait for API)
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_BASE}/chat/message`, {
        message: text,
        session_id: sessionId,
        history: history,                    // send full conversation history
        persona: options.persona || "friendly",
        tone: options.tone || "professional",
        use_rag: options.useRag !== false
      });

      const aiMsg = {
        role: "assistant",
        content: response.data.reply,
        sources: response.data.sources || [],
        ragChunks: response.data.rag_chunks_used,
        id: uuidv4()
      };

      // Add AI response to UI
      setMessages(prev => [...prev, aiMsg]);

      // Update history for next API call (memory)
      setHistory(prev => [
        ...prev,
        { role: "user", content: text },
        { role: "assistant", content: response.data.reply }
      ]);

    } catch (error) {
      const errMsg = {
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        isError: true,
        id: uuidv4()
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [history, isLoading, sessionId]);

  /**
   * Clear all messages and reset conversation memory.
   */
  const clearChat = useCallback(async () => {
    setMessages([]);
    setHistory([]);
    // Also clear from database
    await axios.delete(`${API_BASE}/chat/history/${sessionId}`).catch(() => {});
  }, [sessionId]);

  return { messages, history, isLoading, sessionId, sendMessage, clearChat };
}
