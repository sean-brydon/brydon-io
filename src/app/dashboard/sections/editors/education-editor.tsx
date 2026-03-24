"use client";

import type { SectionEditorProps } from "./types";
import { inputStyle } from "./types";

interface Entry { school: string; degree: string; field: string; startYear: number | ""; endYear: number | "" }

export function EducationEditor({ config, onChange }: SectionEditorProps) {
  const entries: Entry[] = (config.entries as Entry[]) ?? [];

  function update(e: Entry[]) { onChange({ ...config, entries: e }); }

  function updateEntry(i: number, patch: Partial<Entry>) {
    const next = [...entries];
    next[i] = { ...next[i], ...patch };
    update(next);
  }

  function addEntry() {
    update([...entries, { school: "", degree: "", field: "", startYear: "", endYear: "" }]);
  }

  function removeEntry(i: number) {
    update(entries.filter((_, idx) => idx !== i));
  }

  return (
    <div className="space-y-4">
      {entries.map((entry, i) => (
        <div key={i} className="p-3 rounded-lg space-y-2" style={{ border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between">
            <span className="text-[10px]" style={{ color: "var(--text-muted)", opacity: 0.5 }}>entry {i + 1}</span>
            <button
              onClick={() => removeEntry(i)}
              className="text-[10px] px-2 py-0.5 rounded"
              style={{ color: "#ef4444", background: "none", border: "1px solid color-mix(in srgb, #ef4444 30%, transparent)", cursor: "pointer" }}
            >
              remove
            </button>
          </div>
          <input
            value={entry.school}
            onChange={(e) => updateEntry(i, { school: e.target.value })}
            placeholder="school / university"
            className="w-full text-xs px-2 py-1.5 rounded-lg outline-none"
            style={inputStyle}
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              value={entry.degree}
              onChange={(e) => updateEntry(i, { degree: e.target.value })}
              placeholder="degree (e.g. BSc)"
              className="text-xs px-2 py-1.5 rounded-lg outline-none"
              style={inputStyle}
            />
            <input
              value={entry.field}
              onChange={(e) => updateEntry(i, { field: e.target.value })}
              placeholder="field of study"
              className="text-xs px-2 py-1.5 rounded-lg outline-none"
              style={inputStyle}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              value={entry.startYear}
              onChange={(e) => updateEntry(i, { startYear: e.target.value ? parseInt(e.target.value) : "" })}
              placeholder="start year"
              className="text-xs px-2 py-1.5 rounded-lg outline-none"
              style={inputStyle}
            />
            <input
              type="number"
              value={entry.endYear}
              onChange={(e) => updateEntry(i, { endYear: e.target.value ? parseInt(e.target.value) : "" })}
              placeholder="end year"
              className="text-xs px-2 py-1.5 rounded-lg outline-none"
              style={inputStyle}
            />
          </div>
        </div>
      ))}

      <button
        onClick={addEntry}
        className="text-[10px] px-3 py-1.5 rounded-lg"
        style={{ color: "var(--accent)", background: "none", border: "1px solid var(--border)", cursor: "pointer" }}
      >
        + add entry
      </button>
    </div>
  );
}
