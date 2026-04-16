"use client";
export default function VictoryScreen({ winner, player1Id, opponentId, onReset }) {
  const isWinner = winner === player1Id;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white dark:bg-gray-900 transition-colors p-6">
      <h1 className={`text-7xl font-black mb-12 ${isWinner ? 'text-green-500' : 'text-red-500'}`}>
        {isWinner ? "VICTORY" : "DEFEATED"}
      </h1>
      
      <div className="grid grid-cols-2 gap-8 w-full max-w-4xl">
        <StatCard title="You" id={player1Id} isWinner={isWinner} />
        <StatCard title="Opponent" id={opponentId} isWinner={!isWinner} />
      </div>

      <button onClick={onReset} className="mt-12 px-8 py-3 bg-blue-600 text-white rounded-full font-bold">
        PLAY AGAIN
      </button>
    </div>
  );
}

function StatCard({ title, id, isWinner }) {
  return (
    <div className={`p-8 rounded-2xl border-4 ${isWinner ? 'border-green-500' : 'border-gray-300'} dark:bg-gray-800`}>
      <h3 className="text-xl font-bold dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-500 mb-4">{id}</p>
      <div className={`text-lg font-bold ${isWinner ? 'text-green-500' : 'text-red-500'}`}>
        {isWinner ? "Winner" : "Loser"}
      </div>
    </div>
  );
}
