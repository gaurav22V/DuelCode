"use client";
import dynamic from "next/dynamic";

const DiffEditor = dynamic(() => import("@monaco-editor/react").then(mod => mod.DiffEditor), { 
  ssr: false 
});

export default function DiffView({ original, modified }) {
  return (
    <div className="h-64 w-full rounded-xl overflow-hidden border border-gray-300 dark:border-gray-800">
      <DiffEditor
        height="100%"
        original={original}
        modified={modified}
        language="text"
        theme="vs-dark"
        options={{ readOnly: true, renderSideBySide: true }}
      />
    </div>
  );
}
