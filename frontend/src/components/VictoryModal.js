import React from 'react';
import { Trophy } from 'lucide-react';

export default function VictoryModal({ eloUpdate, onReturn }) {
  // If there's no game over data, don't render anything
  if (!eloUpdate) return null;

  return (
    <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[100] p-4 backdrop-blur-sm animate-in zoom-in duration-300">
        <div className="bg-gray-900 p-12 rounded-[2rem] border border-gray-800 text-center max-w-md w-full shadow-2xl shadow-blue-900/20">
            
            {/* The Trophy */}
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-yellow-500/20 blur-xl rounded-full"></div>
              <Trophy className="relative text-yellow-400 mx-auto" size={80}/>
            </div>
            
            {/* Winner Announcement */}
            <h2 className="text-4xl font-black text-white tracking-tighter">MATCH OVER</h2>
            <p className="text-gray-400 font-bold mt-2 uppercase tracking-widest text-sm">
              Winner: <span className="text-blue-400">{eloUpdate.winner}</span>
            </p>
            
            {/* Elo Stats */}
            <div className="my-8 bg-black/60 p-8 rounded-3xl border border-gray-800 shadow-inner">
                <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2">New Global Rank</p>
                <p className="text-7xl font-mono text-white tracking-tighter">{eloUpdate.newElo}</p>
                <p className={`text-2xl font-black mt-2 ${eloUpdate.change?.toString().startsWith('+') ? "text-green-500" : "text-red-500"}`}>
                  {eloUpdate.change} Elo
                </p>
            </div>
            
            {/* Return Button */}
            <button 
              onClick={onReturn} 
              className="w-full bg-white text-black py-4 rounded-xl font-black hover:bg-gray-200 transition-all active:scale-95 text-lg"
            >
              RETURN TO LOBBY
            </button>
        </div>
    </div>
  );
}
