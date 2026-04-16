"use client";
import { useState, useEffect } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const root = window.document.documentElement;
    if (dark) root.classList.add('dark');
    else root.classList.remove('dark');
  }, [dark]);

  return (
    <button onClick={() => setDark(!dark)} className="fixed top-4 right-4 p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-xl shadow-lg">
      {dark ? "☀️" : "🌙"}
    </button>
  );
}