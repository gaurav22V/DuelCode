"use client";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Chrome, LayoutGrid, Terminal, ArrowRight } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      {/* Background Glow Effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-md w-full bg-gray-900 border border-gray-800 p-10 rounded-3xl shadow-2xl relative z-10">
        <div className="text-center mb-10">
          <div className="inline-block p-4 bg-blue-600/10 rounded-2xl mb-6 border border-blue-500/20">
            <Terminal className="text-blue-500" size={40} />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter">DUELCODE</h1>
          <p className="text-gray-500 mt-3 font-medium">The elite arena for competitive C++.</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="w-full bg-white text-black font-black py-4 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-200 transition-all active:scale-95 group"
          >
            <Chrome size={20} />
            Continue with Google
            <ArrowRight size={18} className="opacity-0 group-hover:opacity-100 transition-all -ml-2 group-hover:ml-0" />
          </button>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-800"></span></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-gray-900 px-4 text-gray-600 font-bold tracking-widest">Or join the ranks</span></div>
          </div>

          <Link 
            href="/signup"
            className="w-full block text-center py-4 bg-gray-800 text-white font-bold rounded-xl border border-gray-700 hover:bg-gray-750 hover:border-gray-600 transition-all active:scale-95"
          >
            Create a New Account
          </Link>
        </div>

        <p className="mt-10 text-center text-gray-600 text-xs font-medium leading-relaxed">
          By continuing, you agree to our Terms of Battle and recognize that all code is executed in an isolated C++ sandbox.
        </p>
      </div>
    </div>
  );
}
