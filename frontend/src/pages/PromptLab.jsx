// frontend/src/pages/PromptLab.jsx
// Prompt Tuning & Refinement Lab with Lucide icons

import { useState } from "react";
import axios from "axios";
import { Play, Loader2, CheckCircle2, Square } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

const PERSONAS = {
  formal:     "Formal Bank Officer",
  friendly:   "Friendly Customer Support",
  expert:     "Senior Financial Expert",
  concise:    "Concise FAQ Bot",
  empathetic: "Empathetic Complaints Handler",
};
const TONES = {
  professional: "Professional & Precise",
  warm:         "Warm & Reassuring",
  direct:       "Direct & No-nonsense",
  educational:  "Educational & Explaining",
};
const FORMATS = {
  prose:   "Flowing prose",
  bullets: "Bullet points",
  steps:   "Numbered steps",
  table:   "Structured table format",
};

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

  function buildPrompt() {
    const personaText = {
      formal:     "You are a formal, authoritative bank officer. Use professional language, avoid contractions.",
      friendly:   "You are a warm, friendly customer support agent named Alex. Use approachable, empathetic language.",
      expert:     "You are a senior financial expert with 20 years of banking experience. Provide detailed, precise answers.",
      concise:    "You are a concise FAQ bot. Give the shortest possible accurate answer. No pleasantries.",
      empathetic: "You are an empathetic complaints handler. Always acknowledge frustration first, then resolve.",
    }[persona];
    const toneText = {
      professional: "Maintain a professional, measured tone.",
      warm:         "Use a warm, reassuring tone that makes customers feel valued.",
      direct:       "Be direct and to the point. No fluff.",
      educational:  "Explain clearly as if the customer may not know banking terms.",
    }[tone];
    const formatText = {
      prose:   "Write in clear, flowing prose paragraphs.",
      bullets: "Use bullet points to structure your response.",
      steps:   "Use numbered steps when explaining processes.",
      table:   "Where appropriate, use a structured format with clear labels.",
    }[format];
    return [personaText, `Tone: ${toneText}`, `Format: ${formatText}`, custom ? `Additional instruction: ${custom}` : "", `[Temperature: ${temp}]`].filter(Boolean).join("\n\n");
  }

  async function runTest() {
    if (!question.trim()) return;
    setLoading(true); setBefore("Generating…"); setAfter("Generating…");
    try {
      const [defRes, tunedRes] = await Promise.all([
        axios.post(`${API_BASE}/chat/message`, { message: question, session_id: "lab-default", history: [], persona: "formal", tone: "professional", use_rag: false }),
        axios.post(`${API_BASE}/chat/message`, { message: question, session_id: "lab-tuned",   history: [], persona, tone, use_rag: false }),
      ]);
      setBefore(defRes.data.reply);
      setAfter(tunedRes.data.reply);
    } catch (e) {
      setBefore("Error: " + e.message);
      setAfter("Error: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full overflow-hidden">

      {/* Controls */}
      <aside className="w-80 border-r border-gray-700 overflow-y-auto p-5 flex flex-col gap-5">
        <div>
          <h2 className="text-lg font-semibold text-white mb-1">Prompt Tuning Lab</h2>
          <p className="text-xs text-gray-400 leading-relaxed">
            Adjust settings to change AI behaviour. See the live prompt and compare before/after outputs.
          </p>
        </div>

        {[
          { label: "1. AI Persona",    id: "persona", state: persona, setState: setPersona, options: PERSONAS },
          { label: "2. Response Tone", id: "tone",    state: tone,    setState: setTone,    options: TONES    },
          { label: "3. Output Format", id: "format",  state: format,  setState: setFormat,  options: FORMATS  },
        ].map(({ label, id, state, setState, options }) => (
          <div key={id}>
            <p className="text-xs font-semibold text-yellow-400 uppercase tracking-widest mb-2">{label}</p>
            <select value={state} onChange={e => setState(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-yellow-500">
              {Object.entries(options).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
        ))}

        <div>
          <p className="text-xs font-semibold text-yellow-400 uppercase tracking-widest mb-1">
            4. Temperature: <span className="text-white font-mono">{temp}</span>
          </p>
          <p className="text-xs text-gray-400 mb-2">Low = factual & consistent. High = creative & varied.</p>
          <input type="range" min="0" max="1" step="0.1" value={temp}
            onChange={e => setTemp(parseFloat(e.target.value))}
            className="w-full accent-yellow-400" />
        </div>

        <div>
          <p className="text-xs font-semibold text-yellow-400 uppercase tracking-widest mb-2">5. Custom Instruction</p>
          <textarea value={custom} onChange={e => setCustom(e.target.value)}
            placeholder='e.g. Always end with "Is there anything else I can help you with?"'
            className="w-full bg-gray-800 border border-gray-600 text-white text-sm rounded-lg px-3 py-2 resize-none h-20 outline-none focus:border-yellow-500" />
        </div>

        <div>
          <p className="text-xs font-semibold text-yellow-400 uppercase tracking-widest mb-2">6. Test Question</p>
          <textarea value={question} onChange={e => setQuestion(e.target.value)}
            className="w-full bg-gray-800 border border-gray-600 text-white text-sm rounded-lg px-3 py-2 resize-none h-16 outline-none focus:border-yellow-500" />
        </div>

        <button onClick={runTest} disabled={loading}
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-gradient-to-r from-yellow-500 to-yellow-300 text-gray-900 font-semibold text-sm rounded-lg hover:opacity-90 disabled:opacity-40 transition-opacity">
          {loading
            ? <><Loader2 size={14} className="animate-spin" /> Running…</>
            : <><Play size={14} /> Run & Compare</>
          }
        </button>
      </aside>

      {/* Results */}
      <main className="flex-1 flex flex-col overflow-hidden p-5 gap-4">
        <div>
          <p className="text-xs font-semibold text-yellow-400 uppercase tracking-widest mb-2">Live Prompt Preview</p>
          <pre className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-xs text-gray-300 font-mono whitespace-pre-wrap max-h-36 overflow-y-auto leading-relaxed">
            {buildPrompt()}
          </pre>
        </div>

        <div className="grid grid-cols-2 gap-4 flex-1 overflow-hidden">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 flex flex-col overflow-hidden">
            <div className="flex items-center gap-2 mb-3">
              <Square size={12} className="text-gray-400" />
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Default (no tuning)</h3>
            </div>
            <div className="flex-1 overflow-y-auto text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
              {before || <span className="text-gray-500 italic">Run the test to see default output…</span>}
            </div>
          </div>

          <div className="bg-gray-900 border border-green-800 rounded-xl p-4 flex flex-col overflow-hidden">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 size={12} className="text-green-400" />
              <h3 className="text-xs font-semibold text-green-400 uppercase tracking-widest">Tuned prompt result</h3>
            </div>
            <div className="flex-1 overflow-y-auto text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">
              {after || <span className="text-gray-500 italic">Run the test to see tuned output…</span>}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
