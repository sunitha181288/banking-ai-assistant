// frontend/src/components/Sidebar.jsx
// Document upload sidebar with Lucide icons

import { useState } from "react";
import axios from "axios";
import {
  Upload, FileText, X, Database,
  DownloadCloud, Search, Cpu, MessageSquare
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function Sidebar({ documents, setDocuments, memoryItems }) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver]   = useState(false);

  async function uploadFiles(files) {
    if (!files.length) return;
    setUploading(true);
    const formData = new FormData();
    files.forEach(f => formData.append("files", f));
    try {
      const res = await axios.post(`${API_BASE}/documents/upload`, formData);
      setDocuments(prev => [...prev, ...res.data.documents]);
    } catch (err) {
      alert("Upload failed: " + (err.response?.data?.detail || err.message));
    } finally {
      setUploading(false);
    }
  }

  async function removeDocument(filename) {
    await axios.delete(`${API_BASE}/documents/${encodeURIComponent(filename)}`).catch(() => {});
    setDocuments(prev => prev.filter(d => d.filename !== filename));
  }

  const totalChunks = documents.reduce((sum, d) => sum + (d.chunks || 0), 0);

  return (
    <aside className="w-72 bg-gray-900 border-r border-gray-700 flex flex-col overflow-y-auto">

      {/* Upload Section */}
      <div className="p-4 border-b border-gray-700">
        <p className="text-xs font-semibold text-yellow-400 uppercase tracking-widest mb-3">
          Knowledge Base (RAG)
        </p>

        <label
          className={`flex flex-col items-center gap-2 border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
            dragOver ? "border-yellow-400 bg-yellow-900/10" : "border-gray-600 hover:border-yellow-600"
          }`}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => {
            e.preventDefault();
            setDragOver(false);
            uploadFiles(Array.from(e.dataTransfer.files));
          }}
        >
          <input
            type="file" multiple accept=".txt,.md,.pdf"
            className="hidden"
            onChange={e => uploadFiles(Array.from(e.target.files))}
          />
          <Upload size={24} className="text-gray-400" />
          <div>
            <p className="text-sm text-gray-300 font-medium">
              {uploading ? "Uploading…" : "Drop files or click to upload"}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">.txt · .md · .pdf</p>
          </div>
        </label>

        {documents.length > 0 && (
          <ul className="mt-3 space-y-2">
            {documents.map((doc, i) => (
              <li key={i} className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2">
                <FileText size={14} className="text-yellow-400 flex-shrink-0" />
                <span className="flex-1 text-xs text-gray-200 truncate" title={doc.filename}>
                  {doc.filename}
                </span>
                <span className="text-xs text-green-400 font-medium">{doc.chunks}c</span>
                <button
                  onClick={() => removeDocument(doc.filename)}
                  className="text-gray-500 hover:text-red-400 transition-colors">
                  <X size={12} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* RAG Stats */}
      <div className="p-4 border-b border-gray-700">
        <p className="text-xs font-semibold text-yellow-400 uppercase tracking-widest mb-3">RAG Stats</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Documents", value: documents.length, Icon: FileText },
            { label: "Chunks",    value: totalChunks,      Icon: Database  },
          ].map(({ label, value, Icon }) => (
            <div key={label} className="bg-gray-800 rounded-lg p-3 text-center">
              <div className="flex justify-center mb-1">
                <Icon size={14} className="text-yellow-400" />
              </div>
              <div className="text-xl font-mono text-yellow-400 font-medium">{value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Conversation Memory */}
      <div className="p-4 border-b border-gray-700">
        <p className="text-xs font-semibold text-yellow-400 uppercase tracking-widest mb-3">
          Conversation Memory
        </p>
        {memoryItems.length === 0 ? (
          <p className="text-xs text-gray-500">No memory yet. Start chatting.</p>
        ) : (
          <ul className="space-y-1.5">
            {memoryItems.map((item, i) => (
              <li key={i} className="bg-gray-800 rounded-md px-3 py-2 text-xs text-gray-400 border-l-2 border-yellow-600">
                <span className="text-gray-200 font-medium">Q{memoryItems.length - i}: </span>
                {item}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* How RAG Works */}
      <div className="p-4">
        <p className="text-xs font-semibold text-yellow-400 uppercase tracking-widest mb-3">How It Works</p>
        <div className="space-y-2.5 text-xs text-gray-400">
          {[
            { Icon: DownloadCloud, label: "Ingest",    desc: "file split into chunks"   },
            { Icon: Search,        label: "Retrieve",  desc: "best chunks found"         },
            { Icon: Cpu,           label: "Generate",  desc: "AI answers from chunks"    },
            { Icon: MessageSquare, label: "Remember",  desc: "full history kept"         },
          ].map(({ Icon, label, desc }) => (
            <div key={label} className="flex items-center gap-2">
              <Icon size={13} className="text-yellow-400 flex-shrink-0" />
              <span><strong className="text-gray-200">{label}</strong> — {desc}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
