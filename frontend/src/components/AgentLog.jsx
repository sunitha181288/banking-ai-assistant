// frontend/src/components/AgentLog.jsx
// Renders a single agent execution step with proper Lucide icons

import { Brain, Wrench, BarChart2, CheckCircle2, XCircle } from "lucide-react";

const STEP_CONFIG = {
  thinking: {
    Icon:   Brain,
    label:  "THINKING",
    color:  "text-purple-400",
    border: "border-purple-800",
    bg:     "bg-purple-950/40",
    iconColor: "text-purple-400",
  },
  tool_call: {
    Icon:   Wrench,
    label:  "TOOL CALL",
    color:  "text-blue-400",
    border: "border-blue-800",
    bg:     "bg-blue-950/40",
    iconColor: "text-blue-400",
  },
  tool_result: {
    Icon:   BarChart2,
    label:  "TOOL RESULT",
    color:  "text-teal-400",
    border: "border-teal-800",
    bg:     "bg-teal-950/40",
    iconColor: "text-teal-400",
  },
  done: {
    Icon:   CheckCircle2,
    label:  "COMPLETE",
    color:  "text-green-400",
    border: "border-green-800",
    bg:     "bg-green-950/40",
    iconColor: "text-green-400",
  },
  error: {
    Icon:   XCircle,
    label:  "ERROR",
    color:  "text-red-400",
    border: "border-red-800",
    bg:     "bg-red-950/40",
    iconColor: "text-red-400",
  },
};

export default function AgentLog({ step }) {
  const config = STEP_CONFIG[step.type] || STEP_CONFIG.thinking;
  const { Icon, iconColor } = config;

  function renderContent() {
    if (step.type === "tool_result" && typeof step.content === "object") {
      return (
        <pre className="text-xs font-mono whitespace-pre-wrap overflow-x-auto text-gray-300 leading-relaxed">
          {JSON.stringify(step.content, null, 2)}
        </pre>
      );
    }
    return (
      <p
        className="text-sm text-gray-200 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: String(step.content) }}
      />
    );
  }

  return (
    <div className="flex gap-3 items-start animate-fadeUp">
      {/* Lucide icon */}
      <div className={`mt-0.5 flex-shrink-0 ${iconColor}`}>
        <Icon size={18} />
      </div>

      <div className={`flex-1 border ${config.border} ${config.bg} rounded-xl p-3`}>
        <p className={`text-xs font-semibold uppercase tracking-widest mb-1.5 ${config.color}`}>
          {config.label}
        </p>
        {renderContent()}
        {step.meta && (
          <p className="text-xs text-gray-500 mt-1.5 font-mono">{step.meta}</p>
        )}
      </div>
    </div>
  );
}
