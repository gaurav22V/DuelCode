"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserPlus, Mail, User, ArrowRight } from 'lucide-react';

export default function SignupPage() {
  const [formData, setFormData] = useState({ email: '', username: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const router = useRouter();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch('https://your-render-url.onrender.com/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          username: formData.username.replace(/\s+/g, '') // Remove spaces for Elo tracking
        }),
      });

      const data = await res.json();
      if (data.status === 'success') {
        setMessage({ type: 'success', text: 'Account created! Redirecting to login...' });
        setTimeout(() => router.push('/api/auth/signin'), 2000);
      } else {
        setMessage({ type: 'error', text: data.message || 'Signup failed.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Server error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <div className="max-w-md w-full bg-gray-900 border border-gray-800 p-8 rounded-2xl shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-block p-3 bg-blue-600/20 rounded-full mb-4">
            <UserPlus className="text-blue-500" size={32} />
          </div>
          <h1 className="text-3xl font-black text-white">Join the Arena</h1>
          <p className="text-gray-500 mt-2">Start your journey to the top of the leaderboard.</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
              <input 
                required
                type="text"
                placeholder="Unique username"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-white focus:border-blue-500 outline-none transition-all"
                onChange={(e) => setFormData({...formData, username: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
              <input 
                required
                type="email"
                placeholder="name@example.com"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-white focus:border-blue-500 outline-none transition-all"
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? "Creating Account..." : "Create Account"} <ArrowRight size={18} />
          </button>
        </form>

        {message && (
          <div className={`mt-4 p-3 rounded-lg text-sm font-bold text-center ${message.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            {message.text}
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-800 text-center">
          <p className="text-gray-500 text-sm">
            Already have an account?{' '}
            <Link href="/api/auth/signin" className="text-white hover:underline font-bold">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
