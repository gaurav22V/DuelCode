"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic"; // 1. Import dynamic
import VictoryScreen from "@/components/VictoryScreen";

// 2. Load Monaco Editor dynamically and disable SSR
const Editor = dynamic(() => import("@monaco-editor/react"), { 
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center bg-gray-900 text-white font-bold rounded-3xl">Loading Editor...</div>
});

export default function ArenaClient() {
   // ... rest of your ArenaClient code stays exactly the same
  const { data: session } = useSession();
  
  // Game States: 'idle', 'searching', 'dueling', 'result'
  const [status, setStatus] = useState("idle"); 
  const [problem, setProblem] = useState(null);
  const [code, setCode] = useState("");
  const [verdict, setVerdict] = useState("");
  const [roomId, setRoomId] = useState("");
  const [opponentId, setOpponentId] = useState("");
  
  const socket = useRef(null);

  // 1. WebSocket Matchmaking Logic
  const startSearch = () => {
    if (!session) return alert("Please login to enter the Arena.");
    
    setStatus("searching");
    const userId = session.user.id || session.user.username;
    
    // Connect to FastAPI WebSocket
    socket.current = new WebSocket(`ws://localhost:8000/ws/duel/${userId}`);

    socket.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === "MATCH_START") {
        setProblem(data.problem);
        setRoomId(data.roomId);
        setOpponentId(data.opponentId);
        
        // Set initial C++ starter code from the DB
        setCode(data.problem.starter_code?.cpp || "// Write your solution here...");
        setStatus("dueling");
      }
    };

    socket.current.onclose = () => {
      if (status === "searching") {
        setStatus("idle");
        alert("Connection lost. Try searching again.");
      }
    };
  };

  // 2. Code Submission Logic
  const submitSolution = async () => {
    if (!problem) return;
    setVerdict("Judging...");

    try {
      const response = await fetch("http://localhost:8000/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemId: problem.id,
          code: code,
          roomId: roomId,
          playerId: session.user.id || session.user.username,
        }),
      });

      const result = await response.json();
      setVerdict(result.verdict);

      if (result.verdict === "Accepted") {
        setStatus("result");
      }
    } catch (error) {
      setVerdict("Error connecting to judge");
    }
  };

  const handleReset = () => {
    setStatus("idle");
    setVerdict("");
    setProblem(null);
  };

  // 3. UI Rendering
  if (status === "result") {
    return (
      <VictoryScreen 
        winner={session.user.username} 
         player1Id={session.user.username} 
         opponentId={opponentId} 
       onReset={handleReset} 
     />
  )
  }

  return (
    <div className="w-full max-w-7xl mx-auto mt-10">
      {status === "idle" && (
        <div className="flex flex-col items-center justify-center py-20 bg-gray-50 dark:bg-gray-900 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800">
          <h2 className="text-4xl font-black mb-6 dark:text-white">Ready for a Duel?</h2>
          <button 
            onClick={startSearch}
            className="bg-blue-600 hover:bg-blue-500 text-white px-12 py-4 rounded-2xl font-black text-xl shadow-xl transition-transform hover:scale-105"
          >
            FIND OPPONENT
          </button>
        </div>
      )}

      {status === "searching" && (
        <div className="flex flex-col items-center py-20">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-xl font-bold dark:text-white animate-pulse">Waiting for a worthy rival...</p>
        </div>
      )}

      {status === "dueling" && problem && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[75vh]">
          {/* Left Side: Problem Statement */}
          <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-xl overflow-y-auto border border-gray-100 dark:border-gray-800">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-3xl font-black dark:text-white">{problem.title}</h2>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase">
                {problem.difficulty}
              </span>
            </div>
            <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
              {/* Note: In a real app, use react-markdown here */}
              {problem.description}
            </div>
          </div>

          {/* Right Side: Code Editor */}
          <div className="flex flex-col gap-4">
            <div className="flex-grow rounded-3xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-800">
              <Editor
                height="100%"
                defaultLanguage="cpp"
                theme="vs-dark"
                value={code}
                onChange={(value) => setCode(value)}
                options={{ fontSize: 16, minimap: { enabled: false } }}
              />
            </div>
            
            <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-800">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Verdict</p>
                <p className={`font-mono font-bold ${verdict === 'Accepted' ? 'text-green-500' : 'text-blue-500'}`}>
                  {verdict || "Ready to submit"}
                </p>
              </div>
              <button 
                onClick={submitSolution}
                className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-xl font-black transition-all"
              >
                SUBMIT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
