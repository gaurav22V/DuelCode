"use client";

export default function VictoryScreen({ winner, onReset }) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-white dark:bg-gray-950 z-50 p-6 text-center">
      <h1 className="text-7xl md:text-9xl font-black text-green-500 mb-6 italic tracking-tighter">VICTORY</h1>
      <p className="text-2xl text-gray-600 dark:text-gray-400 mb-12 font-bold uppercase tracking-widest">
        Winner: <span className="text-blue-600 dark:text-blue-400">{winner}</span>
      </p>
      <button 
        onClick={onReset} 
        className="bg-blue-600 hover:bg-blue-500 text-white px-12 py-4 rounded-full font-black text-xl shadow-2xl transition-transform hover:scale-110"
      >
        RETURN TO ARENA
      </button>
    </div>
  );
}
