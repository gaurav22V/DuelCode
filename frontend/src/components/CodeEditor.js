"use client";
import Editor from "@monaco-editor/react";

export default function CodeEditor({ code, onChange, theme = "vs-dark" }) {
  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-2xl">
      <Editor
        height="60vh"
        defaultLanguage="cpp"
        value={code}
        theme={theme}
        onChange={onChange}
        options={{
          fontSize: 16,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          padding: { top: 16 },
        }}
      />
    </div>
  );
}