"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Signup() {
  const [form, setForm] = useState({ email: "", username: "", password: "" });
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    
    try {
      const res = await fetch("http://localhost:8080/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      
      if (res.ok) {
        router.push("/login");
      } else {
        const data = await res.json();
        setError(data.detail || "Signup failed. Try a different username.");
      }
    } catch (err) {
      setError("Server is offline. Check your FastAPI backend.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950 px-4 transition-colors">
      <div className="w-full max-w-md bg-gray-50 dark:bg-gray-900 p-10 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-2xl">
        <h1 className="text-4xl font-black dark:text-white mb-2">Join the Arena</h1>
        <p className="text-gray-500 mb-8">Create your DuelCode account</p>

        {error && <p className="text-red-500 mb-4 font-bold text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">{error}</p>}

        <form onSubmit={handleSignup} className="space-y-4">
          <input 
            type="text" placeholder="Username" required
            className="w-full p-4 bg-white dark:bg-gray-800 dark:text-white rounded-2xl border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 ring-blue-500"
            onChange={e => setForm({...form, username: e.target.value})}
          />
          <input 
            type="email" placeholder="Email Address" required
            className="w-full p-4 bg-white dark:bg-gray-800 dark:text-white rounded-2xl border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 ring-blue-500"
            onChange={e => setForm({...form, email: e.target.value})}
          />
          <input 
            type="password" placeholder="Password" required
            className="w-full p-4 bg-white dark:bg-gray-800 dark:text-white rounded-2xl border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 ring-blue-500"
            onChange={e => setForm({...form, password: e.target.value})}
          />
          <button className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl transition-all transform hover:scale-[1.02]">
            CREATE ACCOUNT
          </button>
        </form>

        <p className="mt-8 text-center text-gray-500 text-sm">
          Already a duelist? <Link href="/login" className="text-blue-500 font-bold">Login here</Link>
        </p>
      </div>
    </div>
  );
}
