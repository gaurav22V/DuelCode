import ArenaClient from "@/components/ArenaClient";
import UserNav from "@/components/UserNav";
import Link from "next/link";

export default function ArenaPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 transition-colors">
      
      {/* Static Server-Rendered Header */}
      <header className="py-5 px-4 md:px-8 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          
          {/* Left Side: Brand & Main Links */}
          <div className="flex items-center gap-8">
            <Link href="/" className="text-2xl font-black tracking-tighter dark:text-white hover:opacity-80 transition-opacity">
              DUEL<span className="text-blue-600">CODE</span>
            </Link>
            
            {/* Navigation Links */}
            <nav className="hidden md:flex gap-6 items-center">
              <Link href="/leaderboard" className="text-sm font-bold text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors uppercase tracking-wide">
                Leaderboard
              </Link>
              <Link href="/profile" className="text-sm font-bold text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors uppercase tracking-wide">
                Profile
              </Link>
            </nav>
          </div>

          {/* Right Side: Server Status & Auth Profile */}
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-widest">
                Server Online
              </span>
            </div>
            
            {/* The interactive Login/Logout button */}
            <UserNav />
          </div>

        </div>
      </header>

      {/* Main Interactive Arena Area */}
      <main className="flex-grow p-4 md:p-8 flex flex-col max-w-7xl mx-auto w-full">
        <ArenaClient />
      </main>
      
      {/* Minimal Footer */}
      <footer className="py-6 text-center border-t border-gray-200 dark:border-gray-800 mt-auto bg-white dark:bg-gray-950">
         <p className="text-xs font-bold text-gray-400 tracking-widest uppercase">
           © 2026 DuelCode Arena • v1.0.0
         </p>
      </footer>

    </div>
  );
}
