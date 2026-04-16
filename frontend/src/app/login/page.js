"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Login() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    const result = await signIn("credentials", {
      username: form.username,
      password: form.password,
      redirect: false,
    });

    if (result.error) {
      setError("Invalid username or password.");
    } else {
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950 px-4 transition-colors">
      <div className="w-full max-w-md bg-gray-50 dark:bg-gray-900 p-10 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-2xl">
        <h1 className="text-4xl font-black dark:text-white mb-8">Welcome Back</h1>

        <form onSubmit={handleLogin} className="space-y-4 mb-6">
          <input 
            type="text" placeholder="Username" required
            className="w-full p-4 bg-white dark:bg-gray-800 dark:text-white rounded-2xl border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 ring-blue-500"
            onChange={e => setForm({...form, username: e.target.value})}
          />
          <input 
            type="password" placeholder="Password" required
            className="w-full p-4 bg-white dark:bg-gray-800 dark:text-white rounded-2xl border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 ring-blue-500"
            onChange={e => setForm({...form, password: e.target.value})}
          />
          <button className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl transition-all">
            LOGIN
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-200 dark:border-gray-800"></span></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-gray-50 dark:bg-gray-900 px-2 text-gray-500">Or continue with</span></div>
        </div>

        {/* GOOGLE AUTH BUTTON */}
        <button 
          onClick={() => signIn("google", { callbackUrl: "/" })}
          className="w-full py-4 bg-white dark:bg-gray-800 dark:text-white border border-gray-200 dark:border-gray-700 font-bold rounded-2xl flex items-center justify-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
        >
          <img src="https://www.svgrepo.com/show/355037/google.svg" className="w-5 h-5" alt="Google" />
          Login with Google
        </button>

        <p className="mt-8 text-center text-gray-500 text-sm">
          New here? <Link href="/signup" className="text-blue-500 font-bold">Create account</Link>
        </p>
      </div>
    </div>
  );
}
