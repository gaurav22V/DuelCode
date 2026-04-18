"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { Play, Send, Search, XCircle, Trophy, Timer, Code2, Terminal, Activity } from 'lucide-react';

export default function ArenaClient() {
  const { data: session } = useSession();
  
  // --- UI States ---
  const [status, setStatus] = useState('idle'); // idle | searching | dueling | over
  const [matchId, setMatchId] = useState(null);
  const [problem, setProblem] = useState(null);
  const [opponent, setOpponent] = useState(null);
  
  // --- Editor & Console States ---
  const [code, setCode] = useState('');
  const [verdict, setVerdict] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [graceTime, setGraceTime] = useState(null);

  // --- NEW V2.0 STATES ---
  const [customInput, setCustomInput] = useState('{\n  "a": 10,\n  "b": 20\n}');
  const [telemetryMsg, setTelemetryMsg] = useState("");
  const [eloUpdate, setEloUpdate] = useState(null);

  const socket = useRef(null);

  // --- WebSocket Logic ---
  const startSearch = () => {
    if (!session) return signIn();
    
    setStatus('searching');
    setVerdict(null);
    setEloUpdate(null);

    // Connect to FastAPI Backend
    const client_id = session.user.name || session.user.email;
    socket.current = new WebSocket(`ws://127.0.0.1:8000/ws/duel/${client_id}`);

    socket.current.onopen = () => console.log("🔌 Connected to Arena");

    socket.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("📡 Incoming:", data);

      switch (data.type) {
        case "MATCH_START":
          const prob = data.problem;
          const starterMap = prob.starter_code || prob.starterCode || {};
          const initialCode = starterMap.cpp || "// Write your C++ code here";

          setMatchId(data.match_id);
          setProblem(prob);
          setOpponent(data.opponent);
          setCode(initialCode);
          setStatus('dueling');

          // Acknowledge match to backend
          socket.current.send(JSON.stringify({ 
            type: "SET_MATCH_ID", 
            match_id: data.match_id 
          }));
          break;

        case "VERDICT":
          setVerdict(data);
          setIsProcessing(false);
          break;

        // --- NEW: OPPONENT TELEMETRY ---
        case "OPPONENT_TELEMETRY":
          const actionText = data.action === "SUBMIT_CODE" ? "submitted their code" : "ran a test";
          setTelemetryMsg(`⚠️ Opponent ${actionText} and got: ${data.verdict}`);
          // Auto-hide after 4 seconds
          setTimeout(() => setTelemetryMsg(""), 4000);
          break;

        case "GRACE_PERIOD_START":
          setGraceTime(data.seconds);
          break;

        case "WAITING_FOR_OPPONENT":
          setVerdict({ status: "Accepted", details: "Waiting for opponent to finish (30s grace)..." });
          break;

        case "MATCH_OVER":
          setVerdict(data);
          setStatus('over');
          setGraceTime(null);
          
          // --- NEW: DISPLAY ELO MATH ---
          setEloUpdate({
            winner: data.winner,
            newElo: data.my_new_elo,
            change: data.elo_change
          });
          break;

        case "SEARCH_CANCELLED":
          setStatus('idle');
          break;
      }
    };

    socket.current.onclose = () => {
      if (status !== 'over') setStatus('idle');
      console.log("🔌 Disconnected");
    };
  };

  const cancelSearch = () => {
    if (socket.current) {
      socket.current.send(JSON.stringify({ type: "CANCEL_SEARCH" }));
      socket.current.close();
    }
    setStatus('idle');
  };

  const handleAction = (type) => {
    if (!socket.current || isProcessing) return;
    setIsProcessing(true);
    socket.current.send(JSON.stringify({
      type: type, // RUN_CODE or SUBMIT_CODE
      code: code,
      problem_id: problem.problem_slug || problem.id
    }));
  };

  const handleCustomRun = () => {
    if (!socket.current || isProcessing) return;
    setIsProcessing(true);
    socket.current.send(JSON.stringify({
      type: "RUN_CUSTOM",
      code: code,
      custom_input: customInput
    }));
  };

  // Timer logic for Grace Period
  useEffect(() => {
    if (graceTime > 0) {
      const timer = setTimeout(() => setGraceTime(graceTime - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [graceTime]);

  // --- UI Components ---

  if (status === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-full">
          <Code2 size={48} className="text-blue-600" />
        </div>
        <h1 className="text-3xl font-bold">Ready for a Duel?</h1>
        <p className="text-gray-500 text-center max-w-md">
          Match with an opponent near your Elo and solve a C++ problem in real-time.
        </p>
        <button 
          onClick={startSearch}
          className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all scale-105 hover:scale-110"
        >
          <Search size={20} /> Find Opponent
        </button>
      </div>
    );
  }

  if (status === 'searching') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="relative">
          <div className="w-24 h-24 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <Search className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-600" size={32} />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold animate-pulse">Searching for Opponent...</h2>
          <p className="text-gray-500 mt-2">Expanding Elo search range...</p>
        </div>
        <button 
          onClick={cancelSearch}
          className="flex items-center gap-2 px-6 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
        >
          <XCircle size={18} /> Cancel
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-12 gap-4 h-[calc(100vh-120px)]">
        {/* LEFT: Problem Statement */}
        <div className="col-span-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold px-3 py-1 bg-orange-100 text-orange-600 rounded-full uppercase">
              {problem?.difficulty || 'Medium'} • 2.0s / 2.0MB
            </span>
            {graceTime && (
              <div className="flex items-center gap-2 text-red-600 font-bold animate-bounce">
                <Timer size={18} /> {graceTime}s LEFT!
              </div>
            )}
          </div>
          <h1 className="text-xl font-bold mb-4">{problem?.title}</h1>
          <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap">
            {problem?.description}
          </div>
        </div>

        {/* Editor & Console */}
        <div className="col-span-8 flex flex-col gap-4">
          
          {/* Code Editor Area */}
          <div className="flex-grow bg-[#1e1e1e] rounded-xl border border-gray-800 overflow-hidden flex flex-col">
            <div className="bg-[#252526] px-4 py-2 flex items-center justify-between border-b border-white/5">
              <span className="text-gray-400 text-xs flex items-center gap-2">
                <Code2 size={14} /> solution.cpp
              </span>
              <span className="text-blue-400 text-xs font-medium flex items-center gap-2">
                <Activity size={14} /> Opponent: {opponent}
              </span>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="flex-grow bg-transparent text-gray-300 font-mono text-sm p-4 outline-none resize-none"
              spellCheck="false"
            />
          </div>

          {/* Custom Input Area */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-3 flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Custom Test Case (JSON)</span>
              <button 
                onClick={handleCustomRun}
                disabled={isProcessing || status === 'over'}
                className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 rounded text-xs font-bold transition-colors disabled:opacity-50"
              >
                <Play size={14} /> Run Custom
              </button>
            </div>
            <textarea
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              className="w-full bg-gray-50 dark:bg-[#1e1e1e] text-blue-600 dark:text-green-400 p-2 rounded font-mono text-xs border border-gray-200 dark:border-gray-800 outline-none resize-y"
              rows="2"
            />
          </div>

          {/* Console / Verdict Area */}
          <div className="h-48 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden shrink-0">
            <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50">
              <span className="text-xs font-bold flex items-center gap-2 uppercase tracking-wider text-gray-500">
                <Terminal size={14} /> Execution Console
              </span>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleAction('RUN_CODE')}
                  disabled={isProcessing || status === 'over'}
                  className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 rounded text-xs font-bold transition-colors disabled:opacity-50"
                >
                  <Play size={14} /> Run DB Tests
                </button>
                <button 
                  onClick={() => handleAction('SUBMIT_CODE')}
                  disabled={isProcessing || status === 'over'}
                  className="flex items-center gap-1.5 px-4 py-1 bg-blue-600 text-white hover:bg-blue-700 rounded text-xs font-bold transition-colors disabled:opacity-50"
                >
                  <Send size={14} /> Submit Final
                </button>
              </div>
              <button 
		    onClick={() => {
			if(window.confirm("Are you sure you want to surrender? You will lose Elo.")) {
			    socket.current.send(JSON.stringify({ type: "SURRENDER" }));
			}
		    }}
		    disabled={isProcessing || status === 'over'}
		    className="flex items-center gap-1.5 px-3 py-1 bg-red-900/40 text-red-400 hover:bg-red-900/60 border border-red-800 rounded text-xs font-bold transition-colors disabled:opacity-50"
		>
		    🏳️ Surrender
		</button>
            </div>
            
            <div className="flex-grow p-4 font-mono text-xs overflow-y-auto">
              {isProcessing ? (
                <div className="text-blue-500 animate-pulse">Running code against judge sandbox...</div>
              ) : verdict ? (
                <div className="space-y-2">
                  <div className={`text-sm font-bold ${verdict.status === 'Accepted' || verdict.status === 'Success' ? 'text-green-500' : 'text-red-500'}`}>
                    {verdict.status} {verdict.winner && `— Winner: ${verdict.winner}`}
                  </div>
                  {verdict.time_ms && <div className="text-gray-500">Time: {verdict.time_ms}ms | Memory: {verdict.memory_mb}MB</div>}
                  <div className="text-gray-400 bg-gray-50 dark:bg-black/20 p-2 rounded whitespace-pre-wrap border border-gray-100 dark:border-gray-800">
                    {verdict.details || (status === 'over' ? 'Match has concluded.' : 'Submit your code to see results.')}
                  </div>
                </div>
              ) : (
                <div className="text-gray-400">Console ready. Click Run or Submit.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 1. Opponent Telemetry Toast */}
      {telemetryMsg && (
        <div className="fixed top-6 right-6 bg-red-600 text-white px-6 py-3 rounded-lg shadow-2xl font-bold animate-bounce z-50 flex items-center gap-2 border-2 border-red-400">
          <Activity size={18} /> {telemetryMsg}
        </div>
      )}

      {/* 2. Match Over / Elo Screen Overlay */}
      {eloUpdate && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100]">
          <div className="bg-gray-900 p-10 rounded-2xl text-center border border-gray-700 shadow-2xl max-w-sm w-full">
            <Trophy size={48} className="text-yellow-400 mx-auto mb-4" />
            <h2 className="text-3xl font-black text-white mb-2">MATCH CONCLUDED</h2>
            <p className="text-lg text-gray-400 mb-6">Winner: <span className="text-yellow-400 font-bold">{eloUpdate.winner}</span></p>

            <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
              <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Your New Elo</p>
              <p className="text-6xl font-mono text-white my-3">{eloUpdate.newElo}</p>
              <p className={`text-xl font-bold ${eloUpdate.change?.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                {eloUpdate.change}
              </p>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="mt-8 w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-bold transition-colors"
            >
              Return to Lobby
            </button>
          </div>
        </div>
      )}
    </>
  );
}
