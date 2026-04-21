// AgentPage.jsx — fully responsive agentic AI page
import { useState, useRef, useEffect } from "react";
import { Search, CreditCard, FileText, ShieldAlert, Ticket, Mail, Bot, Play, Loader2, CheckCircle2 } from "lucide-react";
import AgentLog from "../components/AgentLog";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

const TOOLS = [
  { id:"account_lookup",     Icon:Search,      name:"Account Lookup",     desc:"Fetch customer account details" },
  { id:"transaction_search", Icon:CreditCard,  name:"Transaction Search", desc:"Search transactions by date or amount" },
  { id:"policy_lookup",      Icon:FileText,    name:"Policy Lookup",      desc:"Retrieve bank policies and fees" },
  { id:"flag_account",       Icon:ShieldAlert, name:"Flag Account",       desc:"Flag or freeze an account" },
  { id:"create_ticket",      Icon:Ticket,      name:"Create Ticket",      desc:"Log a support ticket" },
  { id:"send_notification",  Icon:Mail,        name:"Send Notification",  desc:"Send email or SMS to customer" },
];

const SAMPLES = [
  "Customer ACC-4521 says their card was used in Singapore but they're in HK. Investigate and secure their account.",
  "What are the fees for international wire transfers? Create a ticket for customer ACC-7823.",
  "Check account ACC-1234 balance, find transactions over HKD 3000 last month, send a summary email.",
];

export default function AgentPage() {
  const [task,    setTask]    = useState(SAMPLES[0]);
  const [steps,   setSteps]   = useState([]);
  const [running, setRunning] = useState(false);
  const [showTools, setShowTools] = useState(false); // mobile tools toggle
  const logEndRef = useRef(null);

  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior:"smooth" }); }, [steps]);

  async function runAgent() {
    if (!task.trim() || running) return;
    setSteps([]); setRunning(true);
    try {
      const res = await fetch(`${API_BASE}/agent/run`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ task }),
      });
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = dec.decode(value);
        for (const line of text.split("\n").filter(l => l.startsWith("data: "))) {
          const data = line.slice(6).trim();
          if (data === "[DONE]") { setRunning(false); return; }
          try { const s = JSON.parse(data); setSteps(p => [...p, {...s, id:Date.now()+Math.random()}]); } catch {}
        }
      }
    } catch(e) {
      setSteps(p => [...p, { type:"error", content:"Connection error: "+e.message, id:Date.now() }]);
    } finally { setRunning(false); }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Task input — always visible */}
      <div className="p-3 sm:p-4 border-b border-gray-700 flex-shrink-0">
        <p className="text-xs font-semibold text-yellow-400 uppercase tracking-widest mb-2">Task for the Agent</p>
        <div className="flex gap-2">
          <input type="text" value={task} onChange={e => setTask(e.target.value)}
            placeholder="Give the agent a multi-step banking task…"
            className="flex-1 bg-gray-800 border border-gray-600 text-white text-sm rounded-lg px-3 py-2.5 outline-none focus:border-yellow-500 min-w-0" />
          <button onClick={runAgent} disabled={running}
            className="flex items-center gap-1.5 px-3 sm:px-5 py-2.5 bg-gradient-to-r from-yellow-500 to-yellow-300 text-gray-900 font-semibold text-sm rounded-lg hover:opacity-90 disabled:opacity-40 whitespace-nowrap flex-shrink-0">
            {running ? <><Loader2 size={13} className="animate-spin" /><span className="hidden sm:inline">Running…</span></> : <><Play size={13} /><span className="hidden sm:inline">Run Agent</span></>}
          </button>
        </div>

        {/* Sample tasks — horizontal scroll on mobile */}
        <div className="flex gap-2 mt-2 overflow-x-auto pb-1 scrollbar-hide">
          {SAMPLES.map((s, i) => (
            <button key={i} onClick={() => setTask(s)}
              className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full border border-gray-600 bg-gray-800 text-gray-300 hover:border-yellow-600 transition-colors max-w-48 truncate">
              {s.slice(0, 40)}…
            </button>
          ))}
        </div>
      </div>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">

        {/* Tools panel — hidden on mobile by default, shown in desktop sidebar */}
        <aside className="hidden lg:flex w-64 min-w-64 border-r border-gray-700 flex-col overflow-y-auto p-4">
          <p className="text-xs font-semibold text-yellow-400 uppercase tracking-widest mb-3">Available Tools</p>
          <div className="space-y-2">
            {TOOLS.map(({ id, Icon, name, desc }) => (
              <div key={id} className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Icon size={13} className="text-yellow-400 flex-shrink-0" />
                  <span className="text-xs font-medium text-white">{name}</span>
                </div>
                <p className="text-xs text-gray-400 ml-5">{desc}</p>
                <div className="flex items-center gap-1 mt-1.5 ml-5">
                  <CheckCircle2 size={9} className="text-green-400" />
                  <span className="text-xs text-green-400">Enabled</span>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Mobile tools toggle bar */}
        <div className="lg:hidden absolute bottom-16 sm:bottom-0 right-4 z-10">
          <button onClick={() => setShowTools(!showTools)}
            className="bg-gray-800 border border-gray-600 rounded-full px-3 py-1.5 text-xs text-gray-300 shadow-lg">
            {showTools ? "Hide tools" : "View tools (" + TOOLS.length + ")"}
          </button>
        </div>

        {/* Mobile tools drawer */}
        {showTools && (
          <div className="lg:hidden absolute inset-x-0 bottom-0 bg-gray-900 border-t border-gray-700 p-4 z-20 max-h-64 overflow-y-auto">
            <p className="text-xs font-semibold text-yellow-400 uppercase tracking-widest mb-3">Available Tools</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TOOLS.map(({ id, Icon, name }) => (
                <div key={id} className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2">
                  <Icon size={13} className="text-yellow-400 flex-shrink-0" />
                  <span className="text-xs text-white truncate">{name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Execution log */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 sm:space-y-3">
          {steps.length === 0 && !running && (
            <div className="text-center py-12 sm:py-20">
              <div className="flex justify-center mb-3">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gray-800 border border-gray-700 flex items-center justify-center">
                  <Bot size={22} className="text-gray-500 sm:hidden" />
                  <Bot size={26} className="text-gray-500 hidden sm:block" />
                </div>
              </div>
              <p className="text-sm sm:text-base text-gray-400 mb-1">Agent ready</p>
              <p className="text-xs sm:text-sm text-gray-500 max-w-sm mx-auto px-4">
                Give it a task and watch it think, choose tools, and execute step by step.
              </p>
            </div>
          )}

          {steps.map(step => <AgentLog key={step.id} step={step} />)}

          {running && (
            <div className="flex gap-2 sm:gap-3 items-center">
              <Loader2 size={16} className="text-yellow-400 animate-spin flex-shrink-0" />
              <div className="bg-gray-800 border border-gray-700 rounded-xl px-3 sm:px-4 py-2.5">
                <div className="flex gap-1.5">
                  {[0,1,2].map(i => (
                    <div key={i} className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-yellow-400 rounded-full animate-bounce"
                      style={{ animationDelay:`${i*0.2}s` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={logEndRef} />
        </div>
      </div>
    </div>
  );
}
