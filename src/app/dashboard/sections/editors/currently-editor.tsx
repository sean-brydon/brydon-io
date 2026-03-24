"use client";

import type { SectionEditorProps } from "./types";
import { inputStyle, inputClass } from "./types";

interface Item { name: string; detail: string }
interface Category { label: string; items: Item[] }

export function CurrentlyEditor({ config, onChange }: SectionEditorProps) {
  const categories: Category[] = (config.categories as Category[]) ?? [];

  function update(cats: Category[]) {
    onChange({ ...config, categories: cats });
  }

  function updateCategory(i: number, patch: Partial<Category>) {
    const next = [...categories];
    next[i] = { ...next[i], ...patch };
    update(next);
  }

  function addCategory() {
    update([...categories, { label: "", items: [{ name: "", detail: "" }] }]);
  }

  function removeCategory(i: number) {
    update(categories.filter((_, idx) => idx !== i));
  }

  function updateItem(catIdx: number, itemIdx: number, patch: Partial<Item>) {
    const next = [...categories];
    const items = [...next[catIdx].items];
    items[itemIdx] = { ...items[itemIdx], ...patch };
    next[catIdx] = { ...next[catIdx], items };
    update(next);
  }

  function addItem(catIdx: number) {
    const next = [...categories];
    next[catIdx] = { ...next[catIdx], items: [...next[catIdx].items, { name: "", detail: "" }] };
    update(next);
  }

  function removeItem(catIdx: number, itemIdx: number) {
    const next = [...categories];
    next[catIdx] = { ...next[catIdx], items: next[catIdx].items.filter((_, i) => i !== itemIdx) };
    update(next);
  }

  return (
    <div className="space-y-4">
      {categories.map((cat, ci) => (
        <div key={ci} className="p-3 rounded-lg" style={{ border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-3">
            <input
              value={cat.label}
              onChange={(e) => updateCategory(ci, { label: e.target.value })}
              placeholder="category label (e.g. reading)"
              className={`${inputClass} flex-1`}
              style={inputStyle}
            />
            <button
              onClick={() => removeCategory(ci)}
              className="ml-2 text-[10px] px-2 py-1 rounded shrink-0"
              style={{ color: "#ef4444", background: "none", border: "1px solid color-mix(in srgb, #ef4444 30%, transparent)", cursor: "pointer" }}
            >
              remove
            </button>
          </div>

          <div className="space-y-2 ml-3">
            {cat.items.map((item, ii) => (
              <div key={ii} className="flex items-center gap-2">
                <input
                  value={item.name}
                  onChange={(e) => updateItem(ci, ii, { name: e.target.value })}
                  placeholder="name"
                  className="text-xs px-2 py-1.5 rounded-lg outline-none flex-1"
                  style={inputStyle}
                />
                <input
                  value={item.detail}
                  onChange={(e) => updateItem(ci, ii, { detail: e.target.value })}
                  placeholder="detail"
                  className="text-xs px-2 py-1.5 rounded-lg outline-none flex-1"
                  style={inputStyle}
                />
                <button
                  onClick={() => removeItem(ci, ii)}
                  className="text-[10px] shrink-0"
                  style={{ color: "#ef4444", background: "none", border: "none", cursor: "pointer" }}
                >
                  ×
                </button>
              </div>
            ))}
            <button
              onClick={() => addItem(ci)}
              className="text-[10px]"
              style={{ color: "var(--accent)", background: "none", border: "none", cursor: "pointer" }}
            >
              + add item
            </button>
          </div>
        </div>
      ))}

      <button
        onClick={addCategory}
        className="text-[10px] px-3 py-1.5 rounded-lg"
        style={{ color: "var(--accent)", background: "none", border: "1px solid var(--border)", cursor: "pointer" }}
      >
        + add category
      </button>
    </div>
  );
}
