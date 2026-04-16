"use client";
import { DiffEditor } from "@monaco-editor/react";

export default function DiffView({ oldCode, newCode }) {
  return (
    <div className="h-[500px] w-full rounded-xl overflow-hidden border border-gray-700">
      <DiffEditor
        original={oldCode} // Your Code
        modified={newCode} // Winner's Code
        language="cpp"
        theme="vs-dark"
        options={{
          renderSideBySide: true,
          readOnly: true,
          minimap: { enabled: false },
        }}
      />
    </div>
  );
}