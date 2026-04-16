import ArenaClient from "@/components/ArenaClient";

export default function ArenaPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="py-6 px-8 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-black tracking-tighter">DUEL<span className="text-blue-600">CODE</span></h1>
          <div className="flex gap-2 items-center">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Live</span>
          </div>
        </div>
      </header>

      <main className="flex-grow p-4 md:p-8">
        <ArenaClient />
      </main>
    </div>
  );
}