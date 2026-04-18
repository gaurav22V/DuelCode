"use client";
import dynamic from "next/dynamic";

const Editor = dynamic(() => import("@monaco-editor/react"), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-gray-900 animate-pulse rounded-xl"></div>
});

export default function CodeEditor({ code, setCode, language = "cpp" }) {
  return (
    <div className="h-full w-full rounded-xl overflow-hidden border border-gray-300 dark:border-gray-800 shadow-inner">
      <Editor 
        height="100%" 
        defaultLanguage={language} 
        theme="vs-dark" 
        value={code} 
        onChange={(val) => setCode(val || "")} 
        options={{ 
          fontSize: 16, 
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
        }}
      />
    </div>
  );
}
