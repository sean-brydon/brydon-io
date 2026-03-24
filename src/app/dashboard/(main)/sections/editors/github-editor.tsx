"use client";

import type { SectionEditorProps } from "./types";
import { inputStyle, inputClass } from "./types";

export function GitHubEditor({ config, onChange }: SectionEditorProps) {
  return (
    <div>
      <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>github username</label>
      <input
        value={(config.username as string) ?? ""}
        onChange={(e) => onChange({ ...config, username: e.target.value })}
        placeholder="sean-brydon"
        className={inputClass}
        style={inputStyle}
      />
    </div>
  );
}
