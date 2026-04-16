"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function Leaderboard() {
  const [leaders, setLeaders] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8080/leaderboard")
      .then(res => res.json())
      .then(data => setLeaders(data));
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-12">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-5xl font-black">Leaderboard</h1>
          <Link href="/" className="text-blue-500 hover:underline">Arena</Link>
        </div>

        <div className="bg-gray-900 rounded-3xl border border-gray-800 overflow-hidden">
          {leaders.map((user, idx) => (
            <div key={user.username} className="flex justify-between p-6 border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
              <div className="flex items-center gap-4">
                <span className="text-gray-500 font-mono w-8">{idx + 1}.</span>
                <span className="text-xl font-bold">{user.username}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-blue-500 font-black text-2xl">{user.score}</span>
                <span className="text-xs text-gray-500 uppercase tracking-widest">Solves</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}