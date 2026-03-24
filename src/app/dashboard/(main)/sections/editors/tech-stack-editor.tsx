"use client";

import { useState } from "react";
import type { SectionEditorProps } from "./types";
import { inputStyle, inputClass } from "./types";

interface Group { label: string; skills: string[] }

export function TechStackEditor({ config, onChange }: SectionEditorProps) {
  const groups: Group[] = (config.groups as Group[]) ?? [];
  const [inputs, setInputs] = useState<Record<number, string>>({});

  function update(g: Group[]) {
    onChange({ ...config, groups: g });
  }

  function updateGroup(i: number, patch: Partial<Group>) {
    const next = [...groups];
    next[i] = { ...next[i], ...patch };
    update(next);
  }

  function addGroup() {
    update([...groups, { label: "", skills: [] }]);
  }

  function removeGroup(i: number) {
    update(groups.filter((_, idx) => idx !== i));
  }

  function addSkill(gi: number) {
    const val = (inputs[gi] ?? "").trim();
    if (!val) return;
    const next = [...groups];
    next[gi] = { ...next[gi], skills: [...next[gi].skills, val] };
    update(next);
    setInputs((prev) => ({ ...prev, [gi]: "" }));
  }

  function removeSkill(gi: number, si: number) {
    const next = [...groups];
    next[gi] = { ...next[gi], skills: next[gi].skills.filter((_, i) => i !== si) };
    update(next);
  }

  return (
    <div className="space-y-4">
      {groups.map((group, gi) => (
        <div key={gi} className="p-3 rounded-lg" style={{ border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-3">
            <input
              value={group.label}
              onChange={(e) => updateGroup(gi, { label: e.target.value })}
              placeholder="group label (e.g. languages)"
              className={`${inputClass} flex-1`}
              style={inputStyle}
            />
            <button
              onClick={() => removeGroup(gi)}
              className="ml-2 text-[10px] px-2 py-1 rounded shrink-0"
              style={{ color: "#ef4444", background: "none", border: "1px solid color-mix(in srgb, #ef4444 30%, transparent)", cursor: "pointer" }}
            >
              remove
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-2">
            {group.skills.map((skill, si) => (
              <span
                key={si}
                className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full"
                style={{ background: "var(--card-bg)", color: "var(--text)", border: "1px solid var(--border)" }}
              >
                {skill}
                <button
                  onClick={() => removeSkill(gi, si)}
                  className="text-[10px] leading-none"
                  style={{ color: "#ef4444", background: "none", border: "none", cursor: "pointer" }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              value={inputs[gi] ?? ""}
              onChange={(e) => setInputs((prev) => ({ ...prev, [gi]: e.target.value }))}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(gi); } }}
              placeholder="add skill + enter"
              className="text-xs px-2 py-1.5 rounded-lg outline-none flex-1"
              style={inputStyle}
            />
          </div>
        </div>
      ))}

      <button
        onClick={addGroup}
        className="text-[10px] px-3 py-1.5 rounded-lg"
        style={{ color: "var(--accent)", background: "none", border: "1px solid var(--border)", cursor: "pointer" }}
      >
        + add group
      </button>
    </div>
  );
}
