"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react"; 
import ThemeToggle from "../../components/ThemeToggle";

// 2. Add your Render fallback
const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://duelcode-7581.onrender.com";

export default function HistoryPage() {
  const { data: session, status } = useSession(); 
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      
      const safeEmail = session.user.email || "guest@arena.com";
      const emailPrefix = safeEmail.split('@')[0];
      const username = session.user.name?.replace(/\s+/g, '') || emailPrefix;

      async function fetchHistory() {
        try {
          const res = await fetch(`${API_URL}/profile/${username}`);
          const data = await res.json();
          
          if (data.status === "success") {
            setHistory(data.history); 
          }
        } catch (err) {
          console.error("Failed to load history:", err);
        } finally {
          setLoading(false);
        }
      }
      
      fetchHistory();
    } else if (status === "unauthenticated") {
      setLoading(false); 
    }
  }, [status, session]);

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
        <div className="text-center">
          <h2 className="text-2xl font-black mb-4">You must be logged in to view history.</h2>
          <Link href="/" className="text-blue-600 hover:underline font-bold">Return Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors duration-300 p-8">
      <ThemeToggle />
      
      <div className="max-w-5xl mx-auto">
        {/* Header Section */}
        <header className="flex justify-between items-end mb-12 border-b border-gray-100 dark:border-gray-800 pb-6">
          <div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white">
              Duel<span className="text-blue-600">History</span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Your past performance and algorithmic battle logs.
            </p>
          </div>
          <Link 
            href="/" 
            className="px-6 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-bold hover:bg-blue-600 hover:text-white transition-all"
          >
            ← Back to Arena
          </Link>
        </header>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800">
            <p className="text-xl text-gray-500">No duels found yet. Go claim your first victory!</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 uppercase text-xs font-bold tracking-widest">
                <tr>
                  <th className="px-6 py-4">Opponent</th>
                  <th className="px-6 py-4">Verdict</th>
                  <th className="px-6 py-4">Elo Change</th>
                  <th className="px-6 py-4">Played At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
                {history.map((entry, idx) => (
                  <tr key={idx} className="group hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-5">
                      <span className="text-lg font-bold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 transition-colors">
                        VS {entry.opponent}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-tighter ${getVerdictStyle(entry.result)}`}>
                        {entry.result}
                      </span>
                    </td>
                    <td className={`px-6 py-5 font-black ${entry.elo_change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                       {entry.elo_change}
                    </td>
                    <td className="px-6 py-5 text-gray-500 dark:text-gray-500 font-mono text-sm">
                      {new Date(entry.played_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function getVerdictStyle(result) {
  if (result === "Win") return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
  if (result === "Loss") return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  if (result === "Draw") return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
  return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
}