import { useState, useRef, useEffect } from "react";
import { Search, CreditCard, FileText, ShieldAlert, Ticket, Mail, Bot, Play, Loader2, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import AgentLog from "../components/AgentLog";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

const TOOLS = [
  { id:"account_lookup",     Icon:Search,      name:"Account Lookup",     desc:"Fetch account details" },
  { id:"transaction_search", Icon:CreditCard,  name:"Transaction Search", desc:"Search transactions"   },
  { id:"policy_lookup",      Icon:FileText,    name:"Policy Lookup",      desc:"Retrieve policies"     },
  { id:"flag_account",       Icon:ShieldAlert, name:"Flag Account",       desc:"Flag or freeze account"},
  { id:"create_ticket",      Icon:Ticket,      name:"Create Ticket",      desc:"Log support ticket"    },
  { id:"send_notification",  Icon:Mail,        name:"Send Notification",  desc:"Email or SMS customer" },
];

const SAMPLES = [
  "Customer ACC-4521 card used in Singapore but they are in HK. Investigate and secure account.",
  "What are international wire transfer fees? Create ticket for ACC-7823.",
  "Check ACC-1234 balance, find transactions over HKD 3000, send summary email.",
];

export default function AgentPage() {
  const [task,      setTask]      = useState(SAMPLES[0]);
  const [steps,     setSteps]     = useState([]);
  const [running,   setRunning]   = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const logEndRef = useRef(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [steps]);

  async function runAgent() {
    if (!task.trim() || running) return;
    setSteps([]); setRunning(true);
    try {
      const res = await fetch(`${API_BASE}/agent/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task }),
      });
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of dec.decode(value).split("\n").filter(l => l.startsWith("data: "))) {
          const d = line.slice(6).trim();
          if (d === "[DONE]") { setRunning(false); return; }
          try {
            const s = JSON.parse(d);
            setSteps(p => [...p, { ...s, id: Date.now() + Math.random() }]);
          } catch {}
        }
      }
    } catch(e) {
      setSteps(p => [...p, { type:"error", content:"Error: " + e.message, id: Date.now() }]);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── TASK INPUT ── */}
      <div className="p-3 border-b border-gray-700 flex-shrink-0">
        <p className="text-xs font-semibold text-yellow-400 uppercase tracking-widest mb-2">
          Task for the Agent
        </p>

        {/* Input + button stacked on mobile, side by side on sm+ */}
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={task}
            onChange={e => setTask(e.target.value)}
            placeholder="Give the agent a multi-step banking task…"
            className="w-full bg-gray-800 border border-gray-600 text-white text-sm rounded-xl px-3 py-3 outline-none focus:border-yellow-500"
          />
          <button
            onClick={runAgent}
            disabled={running}
            className="flex items-center justify-center gap-2 w-full sm:w-auto sm:whitespace-nowrap px-5 py-3 bg-gradient-to-r from-yellow-500 to-yellow-300 text-gray-900 font-semibold text-sm rounded-xl disabled:opacity-40 transition-opacity"
          >
            {running
              ? <><Loader2 size={15} className="animate-spin" />Running…</>
              : <><Play size={15} />Run Agent</>
            }
          </button>
        </div>

        {/* Sample tasks — horizontal scroll */}
        <div className="flex gap-2 mt-2 overflow-x-auto pb-1"
          style={{ scrollbarWidth:"none", msOverflowStyle:"none" }}>
          {SAMPLES.map((s, i) => (
            <button key={i} onClick={() => setTask(s)}
              className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full border border-gray-600 bg-gray-800 text-gray-300 hover:border-yellow-600 transition-colors">
              {s.length > 45 ? s.slice(0, 45) + "…" : s}
            </button>
          ))}
        </div>
      </div>

      {/* ── TOOLS (collapsible) ── */}
      <div className="border-b border-gray-700 flex-shrink-0">
        <button
          onClick={() => setToolsOpen(!toolsOpen)}
          className="flex items-center justify-between w-full px-4 py-2.5 text-xs font-semibold text-yellow-400">
          <span>Available Tools ({TOOLS.length})</span>
          {toolsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {toolsOpen && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 px-4 pb-3">
            {TOOLS.map(({ id, Icon, name, desc }) => (
              <div key={id} className="bg-gray-800 border border-gray-700 rounded-lg p-2.5">
                <div className="flex items-center gap-2 mb-1">
                  <Icon size={13} className="text-yellow-400 flex-shrink-0" />
                  <span className="text-xs font-medium text-white">{name}</span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
                <div className="flex items-center gap-1 mt-1.5">
                  <CheckCircle2 size={9} className="text-green-400" />
                  <span className="text-xs text-green-400">Enabled</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── EXECUTION LOG ── */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
        {steps.length === 0 && !running && (
          <div className="text-center py-16 px-4">
            <div className="flex justify-center mb-3">
              <div className="w-14 h-14 rounded-2xl bg-gray-800 border border-gray-700 flex items-center justify-center">
                <Bot size={26} className="text-gray-500" />
              </div>
            </div>
            <p className="text-sm text-gray-300 font-medium mb-1">Agent ready</p>
            <p className="text-xs text-gray-500">
              Give it a task and watch it think, choose tools, and execute step by step.
            </p>
          </div>
        )}

        {steps.map(step => <AgentLog key={step.id} step={step} />)}

        {running && (
          <div className="flex gap-3 items-center">
            <Loader2 size={16} className="text-yellow-400 animate-spin flex-shrink-0" />
            <div className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3">
              <div className="flex gap-1.5">
                {[0, 1, 2].map(i => (
                  <div key={i}
                    className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.2}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={logEndRef} />
      </div>
    </div>
  );
}
