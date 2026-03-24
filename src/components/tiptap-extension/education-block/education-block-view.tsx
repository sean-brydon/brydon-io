"use client"

import { useCallback } from "react"
import type { NodeViewProps } from "@tiptap/react"
import { NodeViewWrapper } from "@tiptap/react"
import type { EducationEntry } from "./education-block-extension"
import "./education-block.scss"

export const EducationBlockView: React.FC<NodeViewProps> = ({
  node,
  updateAttributes,
  editor,
}) => {
  const entries: EducationEntry[] = node.attrs.entries ?? []
  const isEditable = editor.isEditable

  const updateEntries = useCallback(
    (next: EducationEntry[]) => {
      updateAttributes({ entries: next })
    },
    [updateAttributes]
  )

  const updateEntry = useCallback(
    (index: number, patch: Partial<EducationEntry>) => {
      const next = [...entries]
      next[index] = { ...next[index], ...patch }
      updateEntries(next)
    },
    [entries, updateEntries]
  )

  const addEntry = useCallback(() => {
    updateEntries([
      ...entries,
      { school: "", degree: "", field: "", startYear: "", endYear: "" },
    ])
  }, [entries, updateEntries])

  const removeEntry = useCallback(
    (index: number) => {
      updateEntries(entries.filter((_, i) => i !== index))
    },
    [entries, updateEntries]
  )

  /* ── Read mode ──────────────────────────────────────────── */
  if (!isEditable) {
    if (entries.length === 0) return null

    return (
      <NodeViewWrapper className="education-block education-block--read">
        <div className="education-block__list">
          {entries.map((entry, i) => {
            const years =
              entry.startYear || entry.endYear
                ? `${entry.startYear || "?"}–${entry.endYear || "Present"}`
                : null

            return (
              <div key={i} className="education-block__item">
                <div className="education-block__header">
                  {entry.school && (
                    <span className="education-block__school">
                      {entry.school}
                    </span>
                  )}
                  {years && (
                    <span className="education-block__years">{years}</span>
                  )}
                </div>
                {(entry.degree || entry.field) && (
                  <span className="education-block__detail">
                    {[entry.degree, entry.field].filter(Boolean).join(" · ")}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </NodeViewWrapper>
    )
  }

  /* ── Edit mode ──────────────────────────────────────────── */
  return (
    <NodeViewWrapper className="education-block education-block--edit">
      <div className="education-block__entries">
        {entries.map((entry, i) => (
          <div key={i} className="education-block__entry">
            <div className="education-block__entry-header">
              <span className="education-block__entry-label">
                entry {i + 1}
              </span>
              <button
                type="button"
                className="education-block__remove-btn"
                onClick={() => removeEntry(i)}
              >
                remove
              </button>
            </div>

            <input
              value={entry.school}
              onChange={(e) => updateEntry(i, { school: e.target.value })}
              placeholder="school / university"
              className="education-block__input education-block__input--full"
            />

            <div className="education-block__row">
              <input
                value={entry.degree}
                onChange={(e) => updateEntry(i, { degree: e.target.value })}
                placeholder="degree (e.g. BSc)"
                className="education-block__input"
              />
              <input
                value={entry.field}
                onChange={(e) => updateEntry(i, { field: e.target.value })}
                placeholder="field of study"
                className="education-block__input"
              />
            </div>

            <div className="education-block__row">
              <input
                type="number"
                value={entry.startYear}
                onChange={(e) =>
                  updateEntry(i, {
                    startYear: e.target.value
                      ? parseInt(e.target.value)
                      : "",
                  })
                }
                placeholder="start year"
                className="education-block__input"
              />
              <input
                type="number"
                value={entry.endYear}
                onChange={(e) =>
                  updateEntry(i, {
                    endYear: e.target.value
                      ? parseInt(e.target.value)
                      : "",
                  })
                }
                placeholder="end year"
                className="education-block__input"
              />
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="education-block__add-btn"
        onClick={addEntry}
      >
        + add entry
      </button>
    </NodeViewWrapper>
  )
}
