"use client";
import { useState, useEffect, useRef } from 'react';

export default function DuelPage() {
  const [status, setStatus] = useState('idle'); // idle, queue, active, result
  const [room, setRoom] = useState(null);
  const [problem, setProblem] = useState(null);
  const [code, setCode] = useState("");
  const [verdict, setVerdict] = useState("");
  const [winner, setWinner] = useState(null);
  const socket = useRef(null);
  const playerId = useRef(`user_${Math.floor(Math.random() * 1000)}`);

  const joinQueue = () => {
    setStatus('queue');
    socket.current = new WebSocket(`ws://localhost:8080/ws/duel/${playerId.current}`);

    socket.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'MATCH_START') {
        setRoom(data.roomId);
        setProblem(data.problem);
        setStatus('active');
      }
      if (data.type === 'GAME_OVER') {
        setWinner(data.winner);
        setStatus('result');
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
        roomId: room,
        playerId: playerId.current
      })
    });
    const data = await res.json();
    setVerdict(data.verdict);
  };

  return (
    <div className="p-8 font-sans">
      <h1 className="text-3xl font-bold mb-4">⚔️ DuelCode</h1>

      {status === 'idle' && (
        <button onClick={joinQueue} className="bg-blue-600 text-white px-6 py-2 rounded">Find a Duel</button>
      )}

      {status === 'queue' && <div className="animate-pulse">Searching for opponent...</div>}

      {status === 'active' && (
        <div className="grid grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-bold">{problem.title}</h2>
            <pre className="mt-4 p-4 bg-gray-100 rounded whitespace-pre-wrap">{problem.description}</pre>
          </div>
          <div>
            <textarea 
              className="w-full h-64 p-4 border font-mono"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="// Write your C++ code here..."
            />
            <button onClick={submitCode} className="mt-4 bg-green-600 text-white px-6 py-2 rounded">Submit</button>
            <div className="mt-2 font-bold text-red-500">{verdict}</div>
          </div>
        </div>
      )}

      {status === 'result' && (
        <div className="text-center mt-20">
          <h2 className="text-5xl font-bold">{winner === playerId.current ? "🎉 YOU WIN!" : "💀 DEFEATED"}</h2>
          <button onClick={() => window.location.reload()} className="mt-8 underline">Play Again</button>
        </div>
      )}
    </div>
  );
}