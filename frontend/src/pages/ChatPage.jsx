import { useState, useRef, useEffect } from "react";
import { Send, Building2, ChevronDown, ChevronUp, Upload, FileText, X, Database } from "lucide-react";
import { useChat } from "../hooks/useChat";
import MessageBubble from "../components/MessageBubble";
import Sidebar from "../components/Sidebar";
import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function ChatPage() {
  const { messages, isLoading, sendMessage, clearChat } = useChat();
  const [input,     setInput]     = useState("");
  const [docs,      setDocs]      = useState([]);
  const [uploading, setUploading] = useState(false);
  const [kbOpen,    setKbOpen]    = useState(false);
  const [memItems,  setMemItems]  = useState([]);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const userMsgs = messages
      .filter(m => m.role === "user")
      .map(m => m.content.length > 42 ? m.content.slice(0, 42) + "…" : m.content)
      .slice(-5).reverse();
    setMemItems(userMsgs);
  }, [messages]);

  async function upload(files) {
    if (!files.length) return;
    setUploading(true);
    const fd = new FormData();
    files.forEach(f => fd.append("files", f));
    try {
      const res = await axios.post(`${API_BASE}/documents/upload`, fd);
      setDocs(p => [...p, ...res.data.documents]);
    } catch(e) {
      alert("Upload failed: " + (e.response?.data?.detail || e.message));
    } finally { setUploading(false); }
  }

  function send() {
    if (!input.trim()) return;
    sendMessage(input); setInput("");
  }

  const SAMPLES = [
    "What are your loan interest rates?",
    "How do I dispute a transaction?",
    "How do I reset my password?",
  ];

  const totalChunks = docs.reduce((s, d) => s + (d.chunks || 0), 0);

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── MOBILE ONLY: Knowledge base collapsible bar ── */}
      <div className="md:hidden bg-gray-900 border-b border-gray-700 flex-shrink-0">
        <button onClick={() => setKbOpen(!kbOpen)}
          className="flex items-center justify-between w-full px-4 py-2.5 text-xs font-semibold text-yellow-400">
          <span className="flex items-center gap-2">
            <Database size={13} />
            Knowledge Base — {docs.length} doc{docs.length !== 1 ? "s" : ""}, {totalChunks} chunks
          </span>
          {kbOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {kbOpen && (
          <div className="px-4 pb-3 flex flex-col gap-2">
            <label className="flex items-center gap-3 border-2 border-dashed border-gray-600 hover:border-yellow-600 rounded-xl p-3 cursor-pointer transition-colors">
              <input type="file" multiple accept=".txt,.md,.pdf" className="hidden"
                onChange={e => upload(Array.from(e.target.files))} />
              <Upload size={16} className="text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-300">{uploading ? "Uploading…" : "Tap to upload .txt / .md / .pdf"}</span>
            </label>
            {docs.map((d, i) => (
              <div key={i} className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2">
                <FileText size={13} className="text-yellow-400 flex-shrink-0" />
                <span className="flex-1 text-xs text-gray-200 truncate">{d.filename}</span>
                <span className="text-xs text-green-400">{d.chunks}c</span>
                <button onClick={async () => {
                  await axios.delete(`${API_BASE}/documents/${encodeURIComponent(d.filename)}`).catch(() => {});
                  setDocs(p => p.filter(x => x.filename !== d.filename));
                }} className="text-gray-500 hover:text-red-400"><X size={12} /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── MAIN LAYOUT: sidebar (desktop) + chat (all screens) ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Desktop sidebar — hidden on mobile via Tailwind */}
        <Sidebar documents={docs} setDocuments={setDocs} memoryItems={memItems} />

        {/* Chat area — takes full width on mobile, remaining width on desktop */}
        <div className="flex flex-col flex-1 overflow-hidden min-w-0">

          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-700 flex-shrink-0">
            <div>
              <p className="text-sm font-semibold text-white">AI Contact Center</p>
              <p className="text-xs text-gray-400 hidden sm:block">RAG · Memory · Claude</p>
            </div>
            <button onClick={clearChat}
              className="text-xs text-gray-400 hover:text-red-400 border border-gray-600 hover:border-red-400 px-2.5 py-1 rounded-full transition-colors">
              Clear
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {messages.length === 0 && (
              <div className="text-center py-8 px-2">
                <div className="flex justify-center mb-3">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-900 to-yellow-700 flex items-center justify-center">
                    <Building2 size={28} className="text-white" />
                  </div>
                </div>
                <p className="text-base font-semibold text-gray-200 mb-1">NexaBank AI</p>
                <p className="text-xs text-gray-400 mb-4">Upload policy docs then ask questions.</p>
                <div className="flex flex-col gap-2">
                  {SAMPLES.map((q, i) => (
                    <button key={i} onClick={() => sendMessage(q)}
                      className="text-xs px-4 py-2.5 rounded-xl border border-yellow-700/40 bg-yellow-900/10 text-yellow-300 hover:bg-yellow-900/20 text-left w-full transition-colors">
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map(m => <MessageBubble key={m.id} message={m} />)}
            {isLoading && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-800 to-yellow-600 flex items-center justify-center flex-shrink-0">
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
                <div className="bg-gray-800 border border-gray-700 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1.5">
                    {[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:`${i*0.2}s`}} />)}
                  </div>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-700 flex-shrink-0">
            <div className="flex gap-2 items-end bg-gray-800 border border-gray-600 focus-within:border-yellow-500 rounded-xl px-3 py-2.5 transition-colors">
              <textarea value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if(e.key==="Enter" && !e.shiftKey && window.innerWidth >= 640){ e.preventDefault(); send(); }}}
                placeholder="Ask about your bank's services…" rows={1}
                className="flex-1 bg-transparent outline-none text-white placeholder-gray-500 text-sm resize-none"
                style={{maxHeight:"80px"}} />
              <button onClick={send} disabled={isLoading || !input.trim()}
                className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-yellow-300 text-gray-900 rounded-lg flex items-center justify-center disabled:opacity-40 flex-shrink-0">
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
