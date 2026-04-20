// frontend/src/pages/AgentPage.jsx
// Agentic AI page with Lucide icons

import { useState, useRef, useEffect } from "react";
import {
  Search, CreditCard, FileText, ShieldAlert,
  Ticket, Mail, Bot, Play, Loader2, CheckCircle2
} from "lucide-react";
import AgentLog from "../components/AgentLog";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

const TOOLS = [
  { id: "account_lookup",     Icon: Search,      name: "Account Lookup",      desc: "Fetch customer account details by ID" },
  { id: "transaction_search", Icon: CreditCard,  name: "Transaction Search",  desc: "Search transactions by date or amount" },
  { id: "policy_lookup",      Icon: FileText,    name: "Policy Lookup",       desc: "Retrieve bank policies and fee schedules" },
  { id: "flag_account",       Icon: ShieldAlert, name: "Flag Account",        desc: "Flag or freeze an account for security" },
  { id: "create_ticket",      Icon: Ticket,      name: "Create Ticket",       desc: "Log a support ticket in the CRM" },
  { id: "send_notification",  Icon: Mail,        name: "Send Notification",   desc: "Send email or SMS to customer" },
];

const SAMPLES = [
  "Customer ACC-4521 says their card was used in Singapore but they're in HK. Investigate and secure their account.",
  "What are the fees for international wire transfers? Create a ticket for customer ACC-7823 asking about it.",
  "Check account ACC-1234 balance, find transactions over HKD 3000 last month, and send the customer a summary.",
];

export default function AgentPage() {
  const [task,    setTask]    = useState(SAMPLES[0]);
  const [steps,   setSteps]   = useState([]);
  const [running, setRunning] = useState(false);
  const logEndRef = useRef(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [steps]);

  async function runAgent() {
    if (!task.trim() || running) return;
    setSteps([]);
    setRunning(true);
    try {
      const response = await fetch(`${API_BASE}/agent/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task }),
      });
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value);
        const lines = text.split("\n").filter(l => l.startsWith("data: "));
        for (const line of lines) {
          const data = line.slice(6).trim();
          if (data === "[DONE]") { setRunning(false); return; }
          try {
            const step = JSON.parse(data);
            setSteps(prev => [...prev, { ...step, id: Date.now() + Math.random() }]);
          } catch {}
        }
      }
    } catch (e) {
      setSteps(prev => [...prev, { type: "error", content: "Connection error: " + e.message, id: Date.now() }]);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="flex h-full overflow-hidden">

      {/* Tool panel */}
      <aside className="w-72 border-r border-gray-700 overflow-y-auto p-4">
        <p className="text-xs font-semibold text-yellow-400 uppercase tracking-widest mb-2">Available Tools</p>
        <p className="text-xs text-gray-400 mb-4 leading-relaxed">
          The agent decides which tools to call based on your task.
        </p>

        <div className="space-y-2 mb-6">
          {TOOLS.map(({ id, Icon, name, desc }) => (
            <div key={id} className="bg-gray-800 border border-gray-700 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Icon size={14} className="text-yellow-400 flex-shrink-0" />
                <span className="text-sm font-medium text-white">{name}</span>
              </div>
              <p className="text-xs text-gray-400 ml-5">{desc}</p>
              <div className="flex items-center gap-1 mt-1.5 ml-5">
                <CheckCircle2 size={10} className="text-green-400" />
                <span className="text-xs text-green-400 font-medium">Enabled</span>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs font-semibold text-yellow-400 uppercase tracking-widest mb-2">Sample Tasks</p>
        <div className="space-y-2">
          {SAMPLES.map((s, i) => (
            <div key={i} onClick={() => setTask(s)}
              className="text-xs text-gray-300 bg-gray-800 border border-gray-700 rounded-lg p-2.5 cursor-pointer hover:border-yellow-600 transition-colors leading-relaxed">
              {s}
            </div>
          ))}
        </div>
      </aside>

      {/* Execution area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Task input */}
        <div className="p-4 border-b border-gray-700 flex-shrink-0">
          <p className="text-xs font-semibold text-yellow-400 uppercase tracking-widest mb-2">Task for the Agent</p>
          <div className="flex gap-3">
            <input
              type="text" value={task} onChange={e => setTask(e.target.value)}
              placeholder="Give the agent a multi-step banking task…"
              className="flex-1 bg-gray-800 border border-gray-600 text-white text-sm rounded-lg px-3 py-2.5 outline-none focus:border-yellow-500"
            />
            <button onClick={runAgent} disabled={running}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-yellow-500 to-yellow-300 text-gray-900 font-semibold text-sm rounded-lg hover:opacity-90 disabled:opacity-40 whitespace-nowrap transition-opacity">
              {running
                ? <><Loader2 size={14} className="animate-spin" /> Running…</>
                : <><Play size={14} /> Run Agent</>
              }
            </button>
          </div>
        </div>

        {/* Execution log */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {steps.length === 0 && !running && (
            <div className="text-center py-20">
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 rounded-2xl bg-gray-800 border border-gray-700 flex items-center justify-center">
                  <Bot size={28} className="text-gray-500" />
                </div>
              </div>
              <p className="text-base text-gray-400 mb-1">Agent ready</p>
              <p className="text-sm text-gray-500">
                Give it a task and watch it think, choose tools, and execute step by step.
              </p>
            </div>
          )}

          {steps.map(step => <AgentLog key={step.id} step={step} />)}

          {running && (
            <div className="flex gap-3 items-center">
              <Loader2 size={18} className="text-yellow-400 animate-spin flex-shrink-0" />
              <div className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3">
                <div className="flex gap-1.5">
                  {[0,1,2].map(i => (
                    <div key={i} className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.2}s` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={logEndRef} />
        </div>
      </main>
    </div>
  );
}
