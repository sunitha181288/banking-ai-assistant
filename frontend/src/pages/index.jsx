import { useState } from "react";
import { MessageSquare, SlidersHorizontal, Bot, Menu, X } from "lucide-react";
import ChatPage   from "./ChatPage";
import PromptLab  from "./PromptLab";
import AgentPage  from "./AgentPage";

const TABS = [
  { id: "chat",   label: "Chat + RAG",    short: "Chat",   Icon: MessageSquare     },
  { id: "prompt", label: "Prompt Tuning", short: "Prompts", Icon: SlidersHorizontal },
  { id: "agent",  label: "Agentic AI",    short: "Agent",  Icon: Bot               },
];

export default function App() {
  const [activeTab, setActiveTab] = useState("chat");
  const [menuOpen, setMenuOpen]   = useState(false);

  return (
    <div className="flex flex-col bg-gray-950 text-white" style={{height:"100dvh"}}>

      {/* ── HEADER ── */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-gray-700 bg-gray-900 flex-shrink-0 z-50">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-yellow-500 to-yellow-300 flex items-center justify-center font-bold text-gray-900 text-sm flex-shrink-0">
            N
          </div>
          <span className="font-semibold text-base sm:text-lg">
            Nexa<span className="text-yellow-400">Bank</span> AI
          </span>
          <span className="hidden md:block text-xs text-gray-500 font-mono">
            Contact Center Intelligence
          </span>
        </div>

        {/* Desktop tab nav */}
        <nav className="hidden sm:flex gap-1 bg-gray-800 rounded-xl p-1">
          {TABS.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === id
                  ? "bg-gray-700 text-white border border-yellow-600/40"
                  : "text-gray-400 hover:text-white"
              }`}>
              <Icon size={13} />
              {label}
            </button>
          ))}
        </nav>

        {/* Mobile hamburger */}
        <button className="sm:hidden p-2 text-gray-400 hover:text-white"
          onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <div className="hidden sm:flex items-center gap-1.5 text-xs text-green-400 bg-green-950 border border-green-800 rounded-full px-3 py-1">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          Online
        </div>
      </header>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="sm:hidden bg-gray-900 border-b border-gray-700 z-40">
          {TABS.map(({ id, label, Icon }) => (
            <button key={id}
              onClick={() => { setActiveTab(id); setMenuOpen(false); }}
              className={`flex items-center gap-3 w-full px-5 py-3.5 text-sm font-medium border-b border-gray-800 last:border-0 ${
                activeTab === id ? "text-yellow-400 bg-gray-800" : "text-gray-300"
              }`}>
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>
      )}

      {/* ── PAGE CONTENT ── */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "chat"   && <ChatPage />}
        {activeTab === "prompt" && <PromptLab />}
        {activeTab === "agent"  && <AgentPage />}
      </div>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="sm:hidden flex border-t border-gray-700 bg-gray-900 flex-shrink-0">
        {TABS.map(({ id, short, Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors ${
              activeTab === id ? "text-yellow-400" : "text-gray-500"
            }`}>
            <Icon size={18} />
            {short}
          </button>
        ))}
      </nav>
    </div>
  );
}
