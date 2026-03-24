"use client";

import type { SectionEditorProps } from "./types";
import { inputStyle, inputClass } from "./types";

export function ContactEditor({ config, onChange }: SectionEditorProps) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>cal.com username</label>
        <input
          value={(config.calUsername as string) ?? ""}
          onChange={(e) => onChange({ ...config, calUsername: e.target.value })}
          placeholder="sean-brydon"
          className={inputClass}
          style={inputStyle}
        />
      </div>
      <div>
        <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>description</label>
        <input
          value={(config.description as string) ?? ""}
          onChange={(e) => onChange({ ...config, description: e.target.value })}
          placeholder="book a 30 min call — times in your timezone"
          className={inputClass}
          style={inputStyle}
        />
      </div>
    </div>
  );
}
