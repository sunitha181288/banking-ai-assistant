// frontend/src/pages/index.jsx
// Main app with tab navigation — Lucide icons in tabs

import { useState } from "react";
import { MessageSquare, SlidersHorizontal, Bot } from "lucide-react";
import ChatPage   from "./ChatPage";
import PromptLab  from "./PromptLab";
import AgentPage  from "./AgentPage";

const TABS = [
  { id: "chat",   label: "Chat + RAG",     Icon: MessageSquare    },
  { id: "prompt", label: "Prompt Tuning",  Icon: SlidersHorizontal },
  { id: "agent",  label: "Agentic AI",     Icon: Bot              },
];

export default function App() {
  const [activeTab, setActiveTab] = useState("chat");

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-gray-700 bg-gray-900 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-500 to-yellow-300 flex items-center justify-center font-bold text-gray-900 text-sm">
            N
          </div>
          <span className="font-semibold text-lg">
            Nexa<span className="text-yellow-400">Bank</span> AI
          </span>
          <span className="text-xs text-gray-500 font-mono hidden sm:block">
            Contact Center Intelligence
          </span>
        </div>

        {/* Tab navigation with Lucide icons */}
        <nav className="flex gap-1 bg-gray-800 rounded-xl p-1">
          {TABS.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === id
                  ? "bg-gray-700 text-white border border-yellow-600/40"
                  : "text-gray-400 hover:text-white"
              }`}>
              <Icon size={13} />
              {label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2 text-xs text-green-400 bg-green-950 border border-green-800 rounded-full px-3 py-1">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          System Online
        </div>
      </header>

      {/* Page content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "chat"   && <ChatPage />}
        {activeTab === "prompt" && <PromptLab />}
        {activeTab === "agent"  && <AgentPage />}
      </div>
    </div>
  );
}
