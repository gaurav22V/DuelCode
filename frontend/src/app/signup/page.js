"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserPlus, Mail, User, ShieldCheck, ArrowLeft } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL

export default function SignupPage() {
  const [formData, setFormData] = useState({ email: '', username: '' });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', msg: '' });
  const router = useRouter();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', msg: '' });

    try {
      const res = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.toLowerCase(),
          username: formData.username.trim()
        }),
      });

      const data = await res.json();
      if (data.status === 'success') {
        setStatus({ type: 'success', msg: 'Rank initialized! Redirecting to login...' });
        setTimeout(() => router.push('/login'), 2000);
      } else {
        setStatus({ type: 'error', msg: data.message || 'Username or Email already taken.' });
      }
    } catch (err) {
      setStatus({ type: 'error', msg: 'Could not connect to the Arena server.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <div className="max-w-md w-full bg-gray-900 border border-gray-800 p-10 rounded-3xl shadow-2xl relative">
        
        <Link href="/login" className="absolute top-8 left-8 text-gray-500 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </Link>

        <div className="text-center mb-10 pt-4">
          <div className="inline-block p-4 bg-green-500/10 rounded-2xl mb-6 border border-green-500/20">
            <UserPlus className="text-green-500" size={32} />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter">CREATE ACCOUNT</h1>
          <p className="text-gray-500 mt-2 text-sm">Register your handle for the global leaderboard.</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-5">
          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 ml-1 tracking-widest">Your Arena Handle</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
              <input 
                required
                type="text"
                placeholder="e.g., CodeNinja"
                className="w-full bg-black border border-gray-800 rounded-xl py-4 pl-12 pr-4 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all font-medium"
                onChange={(e) => setFormData({...formData, username: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 ml-1 tracking-widest">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
              <input 
                required
                type="email"
                placeholder="warrior@example.com"
                className="w-full bg-black border border-gray-800 rounded-xl py-4 pl-12 pr-4 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all font-medium"
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-blue-600/20"
          >
            {loading ? "INITIALIZING..." : "JOIN THE ARENA"}
          </button>
        </form>

        {status.msg && (
          <div className={`mt-6 p-4 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-2 ${status.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
            {status.type === 'success' && <ShieldCheck size={16} />}
            {status.msg}
          </div>
        )}

        <div className="mt-10 text-center">
          <p className="text-gray-500 text-xs font-bold">
            Already a member?{' '}
            <Link href="/login" className="text-white hover:text-blue-400 transition-colors">SIGN IN</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
