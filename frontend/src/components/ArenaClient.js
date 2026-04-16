"use client";

import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import VictoryScreen from "@/components/VictoryScreen";

// Dynamically load Monaco Editor
const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

export default function ArenaClient() {
  const { data: session } = useSession();
  const [status, setStatus] = useState("idle"); 
  const [problem, setProblem] = useState(null);
  const [code, setCode] = useState("");
  const [verdict, setVerdict] = useState("");
  const socket = useRef(null);

  const startSearch = () => {
    if (!session) return alert("Please login first.");
    setStatus("searching");
    
    // Connect to FastAPI Backend
    const userId = session.user?.name || "Player1";
    socket.current = new WebSocket(`ws://localhost:8000/ws/duel/${userId}`);

    socket.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "MATCH_START") {
        setProblem(data.problem);
        setCode(data.problem.starter_code?.cpp || "// Write your C++ code here");
        setStatus("dueling");
      }
    };
  };

  if (status === "result") {
    return <VictoryScreen winner={session?.user?.name} onReset={() => setStatus("idle")} />;
  }

  return (
    <div className="max-w-7xl mx-auto w-full">
      {status === "idle" && (
        <div className="flex justify-center py-20">
          <button onClick={startSearch} className="bg-blue-600 text-white px-12 py-4 rounded-xl font-bold text-xl hover:scale-105 transition-transform">
            FIND OPPONENT
          </button>
        </div>
      )}

      {status === "searching" && (
        <div className="text-center py-20 animate-pulse font-bold text-xl">
          Searching for a rival...
        </div>
      )}

      {status === "dueling" && problem && (
        <div className="grid grid-cols-2 gap-6 h-[75vh]">
          <div className="bg-gray-100 dark:bg-gray-900 p-6 rounded-2xl overflow-auto">
            <h2 className="text-2xl font-bold mb-4">{problem.title}</h2>
            <div>{problem.description}</div>
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex-grow rounded-2xl overflow-hidden border border-gray-800">
              <Editor height="100%" defaultLanguage="cpp" theme="vs-dark" value={code} onChange={setCode} />
            </div>
            <button className="bg-green-600 text-white py-4 rounded-xl font-bold">SUBMIT CODE</button>
          </div>
        </div>
      )}
    </div>
  );
}