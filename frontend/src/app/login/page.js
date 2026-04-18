"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    const res = await signIn("credentials", {
      username, password, redirect: false
    });
    if (res?.ok) router.push("/");
    else alert("Login failed");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="bg-white dark:bg-gray-900 p-10 rounded-3xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-800">
        <form onSubmit={handleLogin}>
          <h1 className="text-3xl font-black mb-6 text-center dark:text-white">ACCESS ARENA</h1>
          <input 
            type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)}
            className="w-full mb-4 p-4 rounded-xl bg-gray-100 dark:bg-gray-800 dark:text-white outline-none" required
          />
          <input 
            type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
            className="w-full mb-6 p-4 rounded-xl bg-gray-100 dark:bg-gray-800 dark:text-white outline-none" required
          />
          <button type="submit" className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold hover:bg-blue-500 transition-colors">
            LOGIN
          </button>
        </form>

        {/* --- GOOGLE BUTTON --- */}
        <div className="mt-6 flex items-center justify-center gap-4">
          <div className="h-px bg-gray-200 dark:bg-gray-800 w-full"></div>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">OR</span>
          <div className="h-px bg-gray-200 dark:bg-gray-800 w-full"></div>
        </div>

        <button 
          type="button" 
          onClick={() => signIn("google")} 
          className="w-full mt-6 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 p-4 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          CONTINUE WITH GOOGLE
        </button>

        <div className="mt-6 text-center">
	  <p className="text-gray-400 text-sm">
	    Don't have an account?{' '}
	    <Link 
	      href="/signup" 
	      className="text-blue-500 hover:text-blue-400 font-bold transition-colors underline decoration-blue-500/30 underline-offset-4"
	    >
	      Create an account
	    </Link>
	  </p>
	</div>
      </div>
    </div>
  );
}
