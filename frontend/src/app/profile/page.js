"use client";
import { useSession } from "next-auth/react";
import ThemeToggle from "@/components/ThemeToggle";

export default function ProfilePage() {
  const { data: session } = useSession();

  if (!session) return <div className="p-20 text-center">Please log in to view your profile.</div>;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 p-8 transition-colors">
      <ThemeToggle />
      <div className="max-w-2xl mx-auto bg-gray-50 dark:bg-gray-900 rounded-3xl p-10 shadow-xl border border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-6 mb-8">
          <img src={session.user.image} className="w-24 h-24 rounded-full border-4 border-blue-500" alt="Avatar" />
          <div>
            <h1 className="text-3xl font-black dark:text-white">{session.user.name}</h1>
            <p className="text-gray-500 font-mono">{session.user.email}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl text-center">
            <span className="block text-4xl font-bold text-blue-600">42</span>
            <span className="text-sm text-gray-400 uppercase tracking-widest">Duels Won</span>
          </div>
          <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl text-center">
            <span className="block text-4xl font-bold text-purple-600">1450</span>
            <span className="text-sm text-gray-400 uppercase tracking-widest">Global Rank</span>
          </div>
        </div>
      </div>
    </div>
  );
}