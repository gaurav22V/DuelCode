"use client";

import { signIn, signOut, useSession } from "next-auth/react";

export default function UserNav() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="h-8 w-20 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>;
  }

  if (session) {
    return (
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
            {session.user?.name}
          </span>
        </div>
        <button 
          onClick={() => signOut()} 
          className="text-xs bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-4 py-2 rounded-full font-bold transition-colors"
        >
          LOG OUT
        </button>
      </div>
    );
  }

  return (
    <button 
      onClick={() => signIn()} 
      className="text-sm bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200 px-6 py-2 rounded-full font-bold transition-colors"
    >
      LOG IN
    </button>
  );
}
