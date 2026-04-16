"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import ThemeToggle from "../../components/ThemeToggle";

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // In a real app, this ID would come from your Auth provider (like Clerk or NextAuth)
  const userId = "user_123"; 

  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch(`http://localhost:8080/history/${userId}`);
        const data = await res.json();
        setHistory(data);
      } catch (err) {
        console.error("Failed to load history:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

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
                  <th className="px-6 py-4">Problem</th>
                  <th className="px-6 py-4">Verdict</th>
                  <th className="px-6 py-4">Submitted At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
                {history.map((entry) => (
                  <tr key={entry.id} className="group hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-5">
                      <span className="text-lg font-bold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 transition-colors">
                        {entry.title}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-tighter ${getVerdictStyle(entry.verdict)}`}>
                        {entry.verdict}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-gray-500 dark:text-gray-500 font-mono text-sm">
                      {new Date(entry.date).toLocaleString()}
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

// Helper to color-code verdicts
function getVerdictStyle(verdict) {
  if (verdict === "Accepted") return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
  if (verdict.includes("WA")) return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  if (verdict === "TLE") return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
  if (verdict === "MLE") return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
  return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
}