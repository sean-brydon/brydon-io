"use client"

import type { NodeViewProps } from "@tiptap/react"
import { NodeViewWrapper } from "@tiptap/react"
import "./currently-block.scss"

interface Item {
  name: string
  detail: string
}

interface Category {
  label: string
  items: Item[]
}

const inputStyle = {
  background: "var(--card-bg)",
  color: "var(--text)",
  border: "1px solid var(--border)",
} as const

const inputClass = "w-full text-xs px-3 py-2.5 rounded-lg outline-none"

export function CurrentlyBlockView({ node, updateAttributes, editor }: NodeViewProps) {
  const categories: Category[] = (node.attrs.categories as Category[]) ?? []
  const isEditable = editor.isEditable

  function update(cats: Category[]) {
    updateAttributes({ categories: cats })
  }

  function updateCategory(i: number, patch: Partial<Category>) {
    const next = [...categories]
    next[i] = { ...next[i], ...patch }
    update(next)
  }

  function addCategory() {
    update([...categories, { label: "", items: [{ name: "", detail: "" }] }])
  }

  function removeCategory(i: number) {
    update(categories.filter((_, idx) => idx !== i))
  }

  function updateItem(catIdx: number, itemIdx: number, patch: Partial<Item>) {
    const next = [...categories]
    const items = [...next[catIdx].items]
    items[itemIdx] = { ...items[itemIdx], ...patch }
    next[catIdx] = { ...next[catIdx], items }
    update(next)
  }

  function addItem(catIdx: number) {
    const next = [...categories]
    next[catIdx] = {
      ...next[catIdx],
      items: [...next[catIdx].items, { name: "", detail: "" }],
    }
    update(next)
  }

  function removeItem(catIdx: number, itemIdx: number) {
    const next = [...categories]
    next[catIdx] = {
      ...next[catIdx],
      items: next[catIdx].items.filter((_, i) => i !== itemIdx),
    }
    update(next)
  }

  return (
    <NodeViewWrapper
      className="currently-block"
      data-type="currently-block"
    >
      {isEditable ? (
        <div className="currently-block__editor space-y-4">
          {categories.map((cat, ci) => (
            <div
              key={ci}
              className="currently-block__category p-3 rounded-lg"
              style={{ border: "1px solid var(--border)" }}
            >
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
                  style={{
                    color: "#ef4444",
                    background: "none",
                    border:
                      "1px solid color-mix(in srgb, #ef4444 30%, transparent)",
                    cursor: "pointer",
                  }}
                  type="button"
                >
                  remove
                </button>
              </div>

              <div className="space-y-2 ml-3">
                {cat.items.map((item, ii) => (
                  <div key={ii} className="flex items-center gap-2">
                    <input
                      value={item.name}
                      onChange={(e) =>
                        updateItem(ci, ii, { name: e.target.value })
                      }
                      placeholder="name"
                      className="text-xs px-2 py-1.5 rounded-lg outline-none flex-1"
                      style={inputStyle}
                    />
                    <input
                      value={item.detail}
                      onChange={(e) =>
                        updateItem(ci, ii, { detail: e.target.value })
                      }
                      placeholder="detail"
                      className="text-xs px-2 py-1.5 rounded-lg outline-none flex-1"
                      style={inputStyle}
                    />
                    <button
                      onClick={() => removeItem(ci, ii)}
                      className="text-[10px] shrink-0"
                      style={{
                        color: "#ef4444",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                      }}
                      type="button"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addItem(ci)}
                  className="text-[10px]"
                  style={{
                    color: "var(--accent)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                  type="button"
                >
                  + add item
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={addCategory}
            className="text-[10px] px-3 py-1.5 rounded-lg"
            style={{
              color: "var(--accent)",
              background: "none",
              border: "1px solid var(--border)",
              cursor: "pointer",
            }}
            type="button"
          >
            + add category
          </button>
        </div>
      ) : (
        <div className="currently-block__display">
          {categories.length === 0 ? (
            <p
              className="text-xs"
              style={{ color: "var(--text-muted)", opacity: 0.5 }}
            >
              No categories yet.
            </p>
          ) : (
            <div className="currently-block__grid">
              {categories.map((cat, ci) => (
                <div key={ci} className="currently-block__grid-item">
                  <span
                    className="text-[11px] font-medium uppercase tracking-wider block mb-3"
                    style={{ color: "var(--text-muted)", opacity: 0.5 }}
                  >
                    {cat.label}
                  </span>
                  <div className="space-y-2">
                    {cat.items.map((item, ii) => (
                      <div key={ii}>
                        <p
                          className="text-xs font-medium"
                          style={{ color: "var(--text)" }}
                        >
                          {item.name}
                        </p>
                        <p
                          className="text-[11px]"
                          style={{
                            color: "var(--text-muted)",
                            opacity: 0.6,
                          }}
                        >
                          {item.detail}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </NodeViewWrapper>
  )
}
