"use client";
import { useEffect, useState } from 'react';

export default function Leaderboard() {
    const [players, setPlayers] = useState([]);

    useEffect(() => {
        fetch('http://localhost:8000/leaderboard')
            .then(res => res.json())
            .then(data => setPlayers(data.leaderboard))
            .catch(err => console.error("Failed to fetch leaderboard", err));
    }, []);

    return (
        <div className="p-8 max-w-2xl mx-auto bg-gray-900 text-white rounded-lg shadow-xl mt-10">
            <h1 className="text-3xl font-bold mb-6 text-yellow-400">🏆 Global Leaderboard</h1>
            <table className="w-full text-left">
                <thead>
                    <tr className="border-b border-gray-700 text-gray-400">
                        <th className="py-3">Rank</th>
                        <th className="py-3">Dueler</th>
                        <th className="py-3 text-right">Elo Rating</th>
                    </tr>
                </thead>
                <tbody>
                    {players.map((player, idx) => (
                        <tr key={idx} className="border-b border-gray-800 hover:bg-gray-800 transition">
                            <td className="py-4 text-xl font-bold">{idx + 1}</td>
                            <td className="py-4">{player.username}</td>
                            <td className="py-4 text-right font-mono text-green-400">{player.elo}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
