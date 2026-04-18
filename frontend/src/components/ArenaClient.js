"use client";
import React, { useState, useEffect, useRef } from 'react';
import VictoryModal from './VictoryModal.js';
import { useSession, signIn } from 'next-auth/react';
import { Play, Send, Search, Timer, Code2, Activity, Flag, Trophy, Loader2, XCircle } from 'lucide-react';

const LOCAL_BACKEND = "localhost:8000"; 

export default function ArenaClient() {
  const { data: session, status: sessionStatus } = useSession();
  
  const [status, setStatus] = useState('idle');
  const [matchId, setMatchId] = useState(null);
  const [problem, setProblem] = useState(null);
  const [opponent, setOpponent] = useState(null);
  const [code, setCode] = useState('');
  const [verdict, setVerdict] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [graceTime, setGraceTime] = useState(null);
  const [telemetryMsg, setTelemetryMsg] = useState("");
  const [eloUpdate, setEloUpdate] = useState(null);

  const socket = useRef(null);

  useEffect(() => {
    const safeEmail = session?.user?.email || "guest@arena.com";
    const emailPrefix = safeEmail.split('@')[0];
    const username = session?.user?.name?.replace(/\s+/g, '') || emailPrefix;
      
    if (session?.user) {
      fetch(`http://${LOCAL_BACKEND}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: safeEmail, username: username })
      }).catch(err => console.log("User sync skipped or DB offline."));
    }
  }, [session]);

  useEffect(() => {
    let timer;
    if (graceTime > 0) timer = setTimeout(() => setGraceTime(graceTime - 1), 1000);
    return () => clearTimeout(timer);
  }, [graceTime]);

  const startSearch = () => {
    if (!session?.user) return; 
    
    setStatus('searching');
    setVerdict(null);
    setEloUpdate(null);

    const safeEmail = session?.user?.email || "guest@arena.com";
    const emailPrefix = safeEmail.split('@')[0];
    const client_id = session?.user?.name?.replace(/\s+/g, '') || emailPrefix;
    
    socket.current = new WebSocket(`ws://${LOCAL_BACKEND}/ws/duel/${client_id}`);

    socket.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      switch (data.type) {
        case "MATCH_START":
          setMatchId(data.match_id);
          setProblem(data.problem);
          setOpponent(data.opponent);
          setCode(data.problem.starter_code?.cpp || "// Write your solve() function here");
          setStatus('dueling');
          break;
        case "VERDICT":
          setVerdict(data);
          setIsProcessing(false);
          break;
        case "OPPONENT_TELEMETRY":
          setTelemetryMsg(`Opponent ${data.action === "SUBMIT_CODE" ? "submitted" : "ran"} code: ${data.verdict}`);
          setTimeout(() => setTelemetryMsg(""), 3000);
          break;
        case "GRACE_PERIOD_START":
          setGraceTime(data.seconds);
          break;
        case "MATCH_OVER":
          setVerdict(data);
          setStatus('over');
          setGraceTime(null);
          setEloUpdate({ winner: data.winner, newElo: data.my_new_elo, change: data.elo_change });
          break;
      }
    };

    socket.current.onclose = () => { if (status !== 'over') setStatus('idle'); };
  };

  const handleAction = (type) => {
    if (!socket.current || isProcessing) return;
    setIsProcessing(true);
    socket.current.send(JSON.stringify({ type, code, match_id: matchId, problem_id: problem.problem_slug }));
  };

  if (sessionStatus === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="text-blue-500 animate-spin" size={40} />
        <p className="text-gray-500 font-mono">Verifying Session...</p>
      </div>
    );
  }

  if (sessionStatus === "unauthenticated") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <XCircle className="text-red-500" size={48} />
        <h1 className="text-2xl font-black text-white">Authentication Required</h1>
        <button onClick={() => signIn()} className="bg-white text-black px-8 py-3 rounded-xl font-bold hover:bg-gray-200">
          Sign In to Play
        </button>
      </div>
    );
  }

  if (status === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 relative z-10">
        <div className="p-4 bg-blue-500/10 rounded-full"><Code2 size={40} className="text-blue-500" /></div>
        <h1 className="text-3xl font-black text-white">LOCAL ARENA</h1>
        <button onClick={startSearch} className="relative z-50 cursor-pointer bg-blue-600 text-white px-10 py-4 rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center gap-2 active:scale-95 shadow-lg shadow-blue-500/20">
          <Search size={20} /> Start Matchmaking
        </button>
      </div>
    );
  }

  if (status === 'searching') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-white">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <h2 className="text-2xl font-bold">Looking for Opponent...</h2>
        <button onClick={() => { socket.current?.close(); setStatus('idle'); }} className="relative z-50 cursor-pointer text-red-500 font-bold hover:underline">Cancel Search</button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-4 h-[calc(100vh-140px)] text-white">
      <div className="col-span-4 bg-gray-900 border border-gray-800 rounded-2xl p-6 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
            <span className="text-[10px] font-black bg-blue-500/20 text-blue-400 px-2 py-1 rounded">LOCAL DEV</span>
            {graceTime && <div className="text-red-500 font-bold flex items-center gap-2 animate-pulse"><Timer size={18}/> {graceTime}s</div>}
        </div>
        <h2 className="text-xl font-black mb-4">{problem?.title}</h2>
        <p className="text-gray-400 text-sm whitespace-pre-wrap leading-relaxed">{problem?.description}</p>
      </div>

      <div className="col-span-8 flex flex-col gap-4">
        <div className="flex-grow bg-black rounded-2xl border border-gray-800 overflow-hidden flex flex-col">
          <div className="bg-gray-900/50 px-4 py-2 border-b border-gray-800 flex justify-between items-center">
            <span className="text-[10px] font-bold text-gray-500 uppercase">solution.cpp</span>
            <span className="text-blue-500 text-[10px] font-black uppercase">VS: {opponent}</span>
          </div>
          <textarea 
            className="flex-grow bg-transparent p-6 font-mono text-sm outline-none resize-none text-gray-300"
            value={code} onChange={(e) => setCode(e.target.value)} spellCheck="false"
          />
        </div>

        <div className="bg-gray-900 p-4 rounded-2xl border border-gray-800 flex items-center gap-4">
          <div className="flex-grow bg-black p-4 rounded-xl border border-gray-800 min-h-[60px] font-mono text-xs">
              {isProcessing ? <p className="text-blue-400 animate-pulse">Running sandbox...</p> : 
               verdict ? <div>
                  <p className={`font-bold ${verdict.status === "Accepted" ? "text-green-500" : "text-red-500"}`}>{verdict.status}</p>
                  <p className="text-gray-600 truncate">{verdict.details}</p>
               </div> : <p className="text-gray-700">Ready.</p>}
          </div>
          <div className="flex flex-col gap-2">
              <button onClick={() => handleAction('RUN_CODE')} className="bg-gray-800 px-6 py-2 rounded-lg font-bold text-xs hover:bg-gray-700">Run</button>
              <button onClick={() => handleAction('SUBMIT_CODE')} className="bg-blue-600 px-6 py-2 rounded-lg font-bold text-xs hover:bg-blue-500">Submit</button>
          </div>
        </div>
      </div>

      {telemetryMsg && (
        <div className="fixed top-12 right-12 bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-sm shadow-2xl animate-bounce flex items-center gap-2">
          <Activity size={16} /> {telemetryMsg}
        </div>
      )}

      <VictoryModal 
        eloUpdate={eloUpdate} 
        onReturn={() => window.location.reload()} 
      />
    </div>
  );
}
