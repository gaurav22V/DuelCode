"use client";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import Editor from "@monaco-editor/react";
import VictoryScreen from "@/components/VictoryScreen";

export default function Arena() {
  const { data: session } = useSession();
  const [status, setStatus] = useState("idle"); // idle, searching, dueling, result
  const [problem, setProblem] = useState(null);
  const [code, setCode] = useState("// Write your C++ code here...");
  const [verdict, setVerdict] = useState("");
  const [roomId, setRoomId] = useState("");
  const socket = useRef(null);

  const startSearch = () => {
    setStatus("searching");
    socket.current = new WebSocket(`ws://localhost:8080/ws/duel/${session?.user?.id || "anon"}`);
    
    socket.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "MATCH_START") {
        setProblem(data.problem);
        setRoomId(data.roomId);
        setStatus("dueling");
      }
    };
  };

  const submitCode = async () => {
    setVerdict("Judging...");
    const res = await fetch("http://localhost:8080/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        problemId: problem.id,
        code: code,
        roomId: roomId,
        playerId: session?.user?.id || "anon",
      }),
    });
    const data = await res.json();
    setVerdict(data.verdict);
    if (data.verdict === "Accepted") setStatus("result");
  };

  if (status === "result") return <VictoryScreen onReset={() => setStatus("idle")} winner={session?.user?.id} />;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      {status === "idle" && (
        <button onClick={startSearch} className="bg-blue-600 px-8 py-4 rounded-xl font-bold">Find a Duel</button>
      )}

      {status === "searching" && <div className="animate-pulse text-2xl">Searching for Opponent...</div>}

      {status === "dueling" && (
        <div className="grid grid-cols-2 gap-6 h-[85vh]">
          <div className="bg-gray-900 p-6 rounded-2xl overflow-y-auto border border-gray-800">
            <h2 className="text-2xl font-black mb-4">{problem.title}</h2>
            <div className="prose prose-invert max-w-none">{problem.description}</div>
          </div>
          <div className="flex flex-col gap-4">
            <Editor height="70%" theme="vs-dark" defaultLanguage="cpp" value={code} onChange={setCode} />
            <div className="flex justify-between items-center bg-gray-900 p-4 rounded-xl">
              <span className={`font-mono ${verdict === "Accepted" ? "text-green-400" : "text-yellow-400"}`}>{verdict}</span>
              <button onClick={submitCode} className="bg-green-600 px-10 py-3 rounded-lg font-bold">SUBMIT CODE</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}