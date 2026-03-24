"use client";

import type { SectionEditorProps } from "./types";
import { inputStyle } from "./types";

export function CustomEditor({ config, onChange }: SectionEditorProps) {
  return (
    <div>
      <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>
        content (markdown) — will support tiptap/novel soon
      </label>
      <textarea
        value={(config.content as string) ?? ""}
        onChange={(e) => onChange({ ...config, content: e.target.value })}
        rows={6}
        placeholder="Write markdown content..."
        className="w-full text-xs px-3 py-2.5 rounded-lg outline-none resize-y font-mono"
        style={inputStyle}
      />
    </div>
  );
}
