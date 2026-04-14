"use client";
import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Send, Code2, Users } from 'lucide-react';

export default function Arena() {
  const [code, setCode] = useState(`#include <iostream>\n\nint main() {\n    int n;\n    std::cin >> n;\n    std::cout << n * n;\n    return 0;\n}`);
  const [verdict, setVerdict] = useState("");
  const [loading, setLoading] = useState(false);
  const [matchStatus, setMatchStatus] = useState("Idle");

  const startMatchmaking = () => {
    setMatchStatus("Searching...");
    const socket = new WebSocket("ws://localhost:8080/ws/matchmake");
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "MATCH_FOUND") setMatchStatus("Opponent Found! Battle Started.");
    };
  };

  const handleSubmit = async () => {
    setLoading(true);
    setVerdict("Judging...");
    const res = await fetch("http://localhost:8080/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ problemId: 1, code }),
    });
    const result = await res.text();
    setVerdict(result);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
      <nav className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <Code2 className="text-green-500" size={32} />
          <h1 className="text-2xl font-black italic tracking-tighter">DUELCODE</h1>
        </div>
        <div className="flex gap-4">
            <button onClick={startMatchmaking} className="flex items-center gap-2 bg-blue-600 px-4 py-2 rounded-md font-bold hover:bg-blue-500">
                <Users size={18}/> {matchStatus}
            </button>
            <button onClick={handleSubmit} disabled={loading} className="flex items-center gap-2 bg-green-600 px-6 py-2 rounded-md font-bold hover:bg-green-500 disabled:opacity-50">
                <Send size={18}/> {loading ? "Judging..." : "Submit"}
            </button>
        </div>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[70vh]">
        <div className="bg-[#111] p-8 rounded-xl border border-white/5 shadow-2xl">
          <h2 className="text-3xl font-bold mb-4">1. Square It</h2>
          <p className="text-gray-400 text-lg leading-relaxed">
            Read an integer <code className="text-green-400 bg-green-400/10 px-2 py-1 rounded">n</code> and print its square.
          </p>
          <div className="mt-8 p-4 bg-black/50 rounded-lg border border-white/5">
            <p className="text-xs uppercase text-gray-500 font-bold mb-2">Input/Output</p>
            <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-gray-400">In: 5</p></div>
                <div><p className="text-sm text-gray-400">Out: 25</p></div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex-1 rounded-xl border border-white/10 overflow-hidden shadow-2xl">
            <Editor height="100%" defaultLanguage="cpp" theme="vs-dark" value={code} onChange={setCode} options={{ fontSize: 16, minimap: { enabled: false } }} />
          </div>
          <div className={`p-4 rounded-lg font-bold ${verdict === "Accepted" ? "bg-green-500/10 text-green-500 border border-green-500/50" : "bg-white/5 text-gray-400 border border-white/10"}`}>
            Verdict: {verdict || "Awaiting Submission"}
          </div>
        </div>
      </div>
    </div>
  );
}
