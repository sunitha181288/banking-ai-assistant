// PromptLab.jsx — fully responsive prompt tuning lab
import { useState } from "react";
import axios from "axios";
import { Play, Loader2, CheckCircle2, Square } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

const PERSONAS = {
  formal:"Formal Bank Officer", friendly:"Friendly Support Agent",
  expert:"Senior Financial Expert", concise:"Concise FAQ Bot", empathetic:"Empathetic Complaints Handler",
};
const TONES = {
  professional:"Professional & Precise", warm:"Warm & Reassuring",
  direct:"Direct & No-nonsense", educational:"Educational & Explaining",
};
const FORMATS = { prose:"Flowing prose", bullets:"Bullet points", steps:"Numbered steps", table:"Structured table" };

export default function PromptLab() {
  const [persona,  setPersona]  = useState("friendly");
  const [tone,     setTone]     = useState("professional");
  const [format,   setFormat]   = useState("prose");
  const [temp,     setTemp]     = useState(0.3);
  const [custom,   setCustom]   = useState("");
  const [question, setQuestion] = useState("My card was declined abroad, what should I do?");
  const [loading,  setLoading]  = useState(false);
  const [before,   setBefore]   = useState("");
  const [after,    setAfter]    = useState("");

  const personaTexts = {
    formal:"You are a formal authoritative bank officer. Use professional language.",
    friendly:"You are a warm friendly customer support agent named Alex.",
    expert:"You are a senior financial expert with 20 years experience.",
    concise:"You are a concise FAQ bot. Give shortest possible accurate answer.",
    empathetic:"You are an empathetic complaints handler. Acknowledge frustration first.",
  };
  const toneTexts = {
    professional:"Maintain a professional measured tone.",
    warm:"Use a warm reassuring tone.",
    direct:"Be direct and to the point.",
    educational:"Explain clearly for someone unfamiliar with banking.",
  };
  const formatTexts = {
    prose:"Write in clear flowing prose.", bullets:"Use bullet points.",
    steps:"Use numbered steps.", table:"Use structured format with labels.",
  };

  function buildPrompt() {
    return [personaTexts[persona], `Tone: ${toneTexts[tone]}`,
      `Format: ${formatTexts[format]}`, custom ? `Additional: ${custom}` : "",
      `[Temperature: ${temp}]`].filter(Boolean).join("\n\n");
  }

  async function runTest() {
    if (!question.trim()) return;
    setLoading(true); setBefore("Generating…"); setAfter("Generating…");
    try {
      const [d, t] = await Promise.all([
        axios.post(`${API_BASE}/chat/message`, { message:question, session_id:"lab-def", history:[], persona:"formal", tone:"professional", use_rag:false }),
        axios.post(`${API_BASE}/chat/message`, { message:question, session_id:"lab-tuned", history:[], persona, tone, use_rag:false }),
      ]);
      setBefore(d.data.reply); setAfter(t.data.reply);
    } catch(e) { setBefore("Error: "+e.message); setAfter("Error: "+e.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Mobile: stacked layout / Desktop: side by side */}
      <div className="flex flex-col lg:flex-row h-full overflow-hidden">

        {/* Controls */}
        <div className="w-full lg:w-80 lg:min-w-80 border-b lg:border-b-0 lg:border-r border-gray-700 overflow-y-auto p-4 sm:p-5 flex flex-col gap-4">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-white mb-1">Prompt Tuning Lab</h2>
            <p className="text-xs text-gray-400 leading-relaxed">Adjust settings to change AI behaviour. See before/after side by side.</p>
          </div>

          {/* Controls grid on mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
            {[
              { label:"1. AI Persona",    state:persona,  setState:setPersona,  options:PERSONAS },
              { label:"2. Response Tone", state:tone,     setState:setTone,     options:TONES    },
              { label:"3. Output Format", state:format,   setState:setFormat,   options:FORMATS  },
            ].map(({ label, state, setState, options }) => (
              <div key={label}>
                <p className="text-xs font-semibold text-yellow-400 uppercase tracking-widest mb-1.5">{label}</p>
                <select value={state} onChange={e => setState(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-yellow-500">
                  {Object.entries(options).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            ))}

            <div>
              <p className="text-xs font-semibold text-yellow-400 uppercase tracking-widest mb-1">
                4. Temperature: <span className="text-white font-mono">{temp}</span>
              </p>
              <input type="range" min="0" max="1" step="0.1" value={temp}
                onChange={e => setTemp(parseFloat(e.target.value))}
                className="w-full accent-yellow-400 mt-1" />
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-yellow-400 uppercase tracking-widest mb-1.5">5. Custom Instruction</p>
            <textarea value={custom} onChange={e => setCustom(e.target.value)}
              placeholder='e.g. Always end with "Is there anything else?"'
              className="w-full bg-gray-800 border border-gray-600 text-white text-sm rounded-lg px-3 py-2 resize-none h-16 outline-none focus:border-yellow-500" />
          </div>

          <div>
            <p className="text-xs font-semibold text-yellow-400 uppercase tracking-widest mb-1.5">6. Test Question</p>
            <textarea value={question} onChange={e => setQuestion(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 text-white text-sm rounded-lg px-3 py-2 resize-none h-14 outline-none focus:border-yellow-500" />
          </div>

          <button onClick={runTest} disabled={loading}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-gradient-to-r from-yellow-500 to-yellow-300 text-gray-900 font-semibold text-sm rounded-lg hover:opacity-90 disabled:opacity-40 transition-opacity">
            {loading ? <><Loader2 size={14} className="animate-spin" />Running…</> : <><Play size={14} />Run & Compare</>}
          </button>
        </div>

        {/* Results */}
        <div className="flex-1 flex flex-col overflow-hidden p-4 sm:p-5 gap-3 sm:gap-4">
          {/* Prompt preview — collapsible on mobile */}
          <div>
            <p className="text-xs font-semibold text-yellow-400 uppercase tracking-widest mb-2">Live Prompt Preview</p>
            <pre className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-xs text-gray-300 font-mono whitespace-pre-wrap max-h-28 sm:max-h-36 overflow-y-auto leading-relaxed">
              {buildPrompt()}
            </pre>
          </div>

          {/* Before / After — stacked on mobile, side by side on sm+ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 overflow-hidden min-h-0">
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-3 sm:p-4 flex flex-col overflow-hidden min-h-32">
              <div className="flex items-center gap-1.5 mb-2 sm:mb-3">
                <Square size={11} className="text-gray-400" />
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Default</h3>
              </div>
              <div className="flex-1 overflow-y-auto text-xs sm:text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                {before || <span className="text-gray-500 italic">Run the test to see default output…</span>}
              </div>
            </div>
            <div className="bg-gray-900 border border-green-800 rounded-xl p-3 sm:p-4 flex flex-col overflow-hidden min-h-32">
              <div className="flex items-center gap-1.5 mb-2 sm:mb-3">
                <CheckCircle2 size={11} className="text-green-400" />
                <h3 className="text-xs font-semibold text-green-400 uppercase tracking-widest">Tuned result</h3>
              </div>
              <div className="flex-1 overflow-y-auto text-xs sm:text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">
                {after || <span className="text-gray-500 italic">Run the test to see tuned output…</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
