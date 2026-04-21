// MessageBubble.jsx — responsive chat bubbles
import { User, Bot, FileText } from "lucide-react";

export default function MessageBubble({ message }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex gap-2 sm:gap-3 items-start animate-fadeUp ${isUser ? "flex-row-reverse" : ""}`}>
      <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        isUser ? "bg-blue-700" : "bg-gradient-to-br from-blue-900 to-yellow-600"
      }`}>
        {isUser ? <User size={13} /> : <Bot size={13} />}
      </div>
      <div className={`max-w-[85%] sm:max-w-[72%] px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl text-sm leading-relaxed ${
        isUser
          ? "bg-blue-900 border border-blue-700 rounded-tr-sm text-white"
          : `bg-gray-800 border rounded-tl-sm text-gray-100 ${message.isError ? "border-red-600 text-red-300" : "border-gray-700"}`
      }`}>
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        {!isUser && message.sources?.length > 0 && (
          <div className="mt-2 pt-2 border-t border-yellow-800/40 flex flex-wrap gap-1 items-center">
            <span className="text-xs text-gray-500">Sources:</span>
            {message.sources.map((src, i) => (
              <span key={i} className="inline-flex items-center gap-1 text-xs bg-yellow-900/40 text-yellow-300 border border-yellow-700/40 px-2 py-0.5 rounded font-mono">
                <FileText size={9} />{src}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
