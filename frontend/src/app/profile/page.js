"use client";
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Trophy, Swords, Target, TrendingUp } from 'lucide-react';

export default function Profile() {
    const { data: session } = useSession();
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (session?.user) {
            // Standardize username the same way we do in the Arena
            const cleanUsername = session.user.name 
                ? session.user.name.replace(/\s+/g, '') 
                : session.user.email.split('@')[0];

            fetch(`http://127.0.0.1:8000/profile/${cleanUsername}`)
                .then(res => res.json())
                .then(data => {
                    if (data.status === "success") {
                        setProfileData(data);
                    }
                    setLoading(false);
                })
                .catch(err => {
                    console.error("Failed to fetch profile", err);
                    setLoading(false);
                });
        }
    }, [session]);

    if (!session) return <div className="p-10 text-center text-white">Please sign in to view your profile.</div>;
    if (loading) return <div className="p-10 text-center text-white animate-pulse">Loading Profile Data...</div>;
    if (!profileData) return <div className="p-10 text-center text-red-500">Profile not found. Play a match first!</div>;

    const { user, stats, history } = profileData;

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-8 mt-10">
            {/* Header Section */}
            <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 shadow-2xl flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black text-white">{user.username}</h1>
                    <p className="text-gray-400 mt-2">{user.email}</p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-gray-500 uppercase tracking-widest font-bold">Global Elo Rating</p>
                    <p className="text-6xl font-mono text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.3)]">
                        {user.elo}
                    </p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-6">
                <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 flex items-center gap-4">
                    <div className="p-3 bg-blue-500/20 rounded-lg text-blue-500"><Swords size={28} /></div>
                    <div>
                        <p className="text-sm text-gray-400">Total Matches</p>
                        <p className="text-3xl font-bold text-white">{stats.total_matches}</p>
                    </div>
                </div>
                <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 flex items-center gap-4">
                    <div className="p-3 bg-green-500/20 rounded-lg text-green-500"><Trophy size={28} /></div>
                    <div>
                        <p className="text-sm text-gray-400">Total Wins</p>
                        <p className="text-3xl font-bold text-white">{stats.wins}</p>
                    </div>
                </div>
                <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 flex items-center gap-4">
                    <div className="p-3 bg-purple-500/20 rounded-lg text-purple-500"><Target size={28} /></div>
                    <div>
                        <p className="text-sm text-gray-400">Win Rate</p>
                        <p className="text-3xl font-bold text-white">{stats.win_rate}%</p>
                    </div>
                </div>
            </div>

            {/* Match History Table */}
            <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 shadow-xl">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <TrendingUp className="text-gray-400" /> Recent Match History
                </h2>
                
                {history.length === 0 ? (
                    <p className="text-gray-500 text-center py-6">No matches played yet. Enter the Arena!</p>
                ) : (
                    <div className="overflow-hidden rounded-xl border border-gray-800">
                        <table className="w-full text-left">
                            <thead className="bg-gray-800/50 text-gray-400 text-sm">
                                <tr>
                                    <th className="py-4 px-6 font-semibold">Opponent</th>
                                    <th className="py-4 px-6 font-semibold">Result</th>
                                    <th className="py-4 px-6 font-semibold">Elo Change</th>
                                    <th className="py-4 px-6 font-semibold text-right">Date</th>
                                </tr>
                            </thead>
                            <tbody className="text-white">
                                {history.map((match, idx) => (
                                    <tr key={idx} className="border-t border-gray-800 hover:bg-gray-800/50 transition">
                                        <td className="py-4 px-6 font-medium">{match.opponent}</td>
                                        <td className="py-4 px-6">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${match.result === 'Win' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                                {match.result}
                                            </span>
                                        </td>
                                        <td className={`py-4 px-6 font-mono font-bold ${match.elo_change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                                            {match.elo_change}
                                        </td>
                                        <td className="py-4 px-6 text-right text-gray-500 text-sm">
                                            {match.played_at}
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
