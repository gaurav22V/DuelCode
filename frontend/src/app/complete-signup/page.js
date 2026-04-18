"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function CompleteSignupPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get("email");
    if (emailParam) setEmail(emailParam);
    else router.push("/login"); 
  }, [router]);

  const handleComplete = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API_URL}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, email })
    });

    if (res.ok) {
      const loginRes = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });
      if (loginRes?.ok) router.push("/"); 
    } else {
      alert("Username is already taken. Try another one!");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <form onSubmit={handleComplete} className="bg-white dark:bg-gray-900 p-10 rounded-3xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-800">
        <h1 className="text-3xl font-black mb-2 text-center dark:text-white">LINK ACCOUNT</h1>
        <p className="text-center text-sm text-gray-500 font-bold mb-8">
          Linking to: <span className="text-blue-500">{email}</span>
        </p>

        <input 
          type="text" placeholder="Choose a DuelCode Username" value={username} onChange={e => setUsername(e.target.value)}
          className="w-full mb-4 p-4 rounded-xl bg-gray-100 dark:bg-gray-800 dark:text-white outline-none font-bold" required
        />
        <input 
          type="password" placeholder="Set a Backup Password" value={password} onChange={e => setPassword(e.target.value)}
          className="w-full mb-8 p-4 rounded-xl bg-gray-100 dark:bg-gray-800 dark:text-white outline-none font-bold" required
        />
        
        <button type="submit" className="w-full bg-blue-600 text-white p-4 rounded-xl font-black uppercase hover:bg-blue-500">
          FINISH PROFILE
        </button>
      </form>
    </div>
  );
}
