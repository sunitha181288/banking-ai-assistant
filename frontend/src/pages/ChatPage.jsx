// frontend/src/pages/ChatPage.jsx
// Main chat interface with Lucide icons

import { useState, useRef, useEffect } from "react";
import { Send, Building2 } from "lucide-react";
import { useChat } from "../hooks/useChat";
import MessageBubble from "../components/MessageBubble";
import Sidebar from "../components/Sidebar";

export default function ChatPage() {
  const { messages, isLoading, sendMessage, clearChat } = useChat();
  const [inputText,   setInputText]   = useState("");
  const [documents,   setDocuments]   = useState([]);
  const [memoryItems, setMemoryItems] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const userMsgs = messages
      .filter(m => m.role === "user")
      .map(m => m.content.length > 45 ? m.content.slice(0, 45) + "…" : m.content)
      .slice(-5).reverse();
    setMemoryItems(userMsgs);
  }, [messages]);

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  function handleSend() {
    if (!inputText.trim()) return;
    sendMessage(inputText);
    setInputText("");
  }

  const SAMPLE_QUESTIONS = [
    "What are your loan interest rates?",
    "How do I dispute a transaction?",
    "What documents do I need to open an account?",
  ];

  return (
    <div className="flex h-full overflow-hidden">
      <Sidebar documents={documents} setDocuments={setDocuments} memoryItems={memoryItems} />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-700 flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-white">AI Contact Center Agent</h2>
            <p className="text-xs text-gray-400">RAG-grounded · Multi-turn memory · Claude-powered</p>
          </div>
          <button onClick={clearChat}
            className="text-xs text-gray-400 hover:text-red-400 border border-gray-600 hover:border-red-400 px-3 py-1 rounded-full transition-colors">
            Clear chat
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-16">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-900 to-yellow-700 flex items-center justify-center">
                  <Building2 size={32} className="text-white" />
                </div>
              </div>
              <p className="text-lg font-semibold text-gray-200 mb-1">NexaBank AI Assistant</p>
              <p className="text-sm text-gray-400 mb-6">Upload policy documents, then ask customer questions.</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {SAMPLE_QUESTIONS.map((q, i) => (
                  <button key={i} onClick={() => sendMessage(q)}
                    className="text-xs px-3 py-1.5 rounded-full border border-yellow-700/40 bg-yellow-900/10 text-yellow-300 hover:bg-yellow-900/20 transition-colors">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map(msg => <MessageBubble key={msg.id} message={msg} />)}

          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-800 to-yellow-600 flex items-center justify-center flex-shrink-0">
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1.5">
                  {[0,1,2].map(i => (
                    <div key={i} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.2}s` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-700 flex-shrink-0">
          <div className="flex gap-2 items-end bg-gray-800 border border-gray-600 focus-within:border-yellow-500 rounded-xl px-4 py-3 transition-colors">
            <textarea
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about your bank's services…"
              rows={1}
              className="flex-1 bg-transparent outline-none text-white placeholder-gray-500 text-sm resize-none"
            />
            <button onClick={handleSend} disabled={isLoading || !inputText.trim()}
              className="w-9 h-9 bg-gradient-to-br from-yellow-500 to-yellow-300 text-gray-900 rounded-lg flex items-center justify-center disabled:opacity-40 hover:scale-105 transition-transform flex-shrink-0">
              <Send size={15} />
            </button>
          </div>
          <p className="text-xs text-gray-500 text-center mt-2">Enter to send · Shift+Enter for new line</p>
        </div>
      </main>
    </div>
  );
}
