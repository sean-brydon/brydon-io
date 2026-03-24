"use client"

import type { NodeViewProps } from "@tiptap/react"
import { NodeViewWrapper } from "@tiptap/react"
import { Particles } from "@/components/particles"
import "./hero-block.scss"

const inputStyle = {
  background: "var(--card-bg)",
  color: "var(--text)",
  border: "1px solid var(--border)",
} as const

const inputClass = "w-full text-xs px-3 py-2.5 rounded-lg outline-none"

const selectClass = "text-xs px-3 py-2.5 rounded-lg outline-none"

/* ── SVG path presets ── */
const SVG_PRESETS: { label: string; d: string }[] = [
  {
    label: "Star",
    d: "M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z",
  },
  {
    label: "Lightning",
    d: "M13 2L3 14h9l-1 10 10-12h-9l1-10z",
  },
  {
    label: "Music note",
    d: "M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z",
  },
  {
    label: "Code",
    d: "M16 18l6-6-6-6M8 6l-6 6 6 6",
  },
  {
    label: "Rocket",
    d: "M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09zM12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z",
  },
  {
    label: "Diamond",
    d: "M12 2L2 12l10 10 10-10L12 2z",
  },
]

export function HeroBlockView({ node, updateAttributes, editor }: NodeViewProps) {
  const {
    shape1Type,
    shape1Text,
    shape1Svg,
    shape2Type,
    shape2Text,
    shape2Svg,
    height,
    particleCount,
    showBadge,
    badgeText,
  } = node.attrs as {
    shape1Type: string
    shape1Text: string
    shape1Svg: string
    shape2Type: string
    shape2Text: string
    shape2Svg: string
    height: number
    particleCount: number
    showBadge: boolean
    badgeText: string
  }

  const isEditable = editor.isEditable

  return (
    <NodeViewWrapper
      className="hero-block"
      data-type="hero-block"
    >
      {isEditable ? (
        <div className="hero-block__editor space-y-3">
          {/* Live preview */}
          <div
            className="hero-block__preview relative overflow-hidden rounded-lg"
            style={{
              height: `${height}px`,
              background: "var(--card-bg)",
            }}
          >
            <Particles
              className="absolute inset-0"
              shape1Type={shape1Type}
              shape1Text={shape1Text}
              shape1Svg={shape1Svg}
              shape2Type={shape2Type}
              shape2Text={shape2Text}
              shape2Svg={shape2Svg}
              particleCount={particleCount}
            />
            {showBadge && (
              <div
                className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] pointer-events-none select-none"
                style={{
                  background: "color-mix(in srgb, var(--bg) 70%, transparent)",
                  backdropFilter: "blur(4px)",
                  color: "var(--text-muted)",
                  border: "1px solid var(--border)",
                }}
              >
                {badgeText}
              </div>
            )}
          </div>

          {/* Settings panel */}
          <div
            className="hero-block__settings p-3 rounded-lg space-y-3"
            style={{ border: "1px solid var(--border)" }}
          >
            <p
              className="text-[10px] font-medium uppercase tracking-wider"
              style={{ color: "var(--text-muted)", opacity: 0.5 }}
            >
              Hero Settings
            </p>

            {/* ── Shape 1 ── */}
            <div className="space-y-1.5">
              <label
                className="text-[10px] block"
                style={{ color: "var(--text-muted)" }}
              >
                Shape 1 (default)
              </label>
              <div className="flex gap-2">
                <select
                  value={shape1Type}
                  onChange={(e) => updateAttributes({ shape1Type: e.target.value })}
                  className={selectClass}
                  style={inputStyle}
                >
                  <option value="heart">Heart</option>
                  <option value="text">Text</option>
                  <option value="svg">SVG</option>
                </select>
                {shape1Type === "text" && (
                  <input
                    value={shape1Text}
                    onChange={(e) => updateAttributes({ shape1Text: e.target.value })}
                    placeholder="e.g. S B"
                    className={`${inputClass} flex-1`}
                    style={inputStyle}
                  />
                )}
              </div>
              {shape1Type === "svg" && (
                <div className="space-y-1">
                  <div className="flex gap-2 items-center">
                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value) {
                          updateAttributes({ shape1Svg: e.target.value })
                        }
                      }}
                      className={selectClass}
                      style={inputStyle}
                    >
                      <option value="">Presets…</option>
                      {SVG_PRESETS.map((p) => (
                        <option key={p.label} value={p.d}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <textarea
                    value={shape1Svg}
                    onChange={(e) => updateAttributes({ shape1Svg: e.target.value })}
                    placeholder="M12 2l3.09 6.26L22 9.27…"
                    rows={3}
                    className={`${inputClass} resize-y`}
                    style={{ ...inputStyle, fontFamily: "monospace", fontSize: "10px" }}
                  />
                </div>
              )}
            </div>

            {/* ── Shape 2 ── */}
            <div className="space-y-1.5">
              <label
                className="text-[10px] block"
                style={{ color: "var(--text-muted)" }}
              >
                Shape 2 (morph target)
              </label>
              <div className="flex gap-2">
                <select
                  value={shape2Type}
                  onChange={(e) => updateAttributes({ shape2Type: e.target.value })}
                  className={selectClass}
                  style={inputStyle}
                >
                  <option value="heart">Heart</option>
                  <option value="text">Text</option>
                  <option value="svg">SVG</option>
                </select>
                {shape2Type === "text" && (
                  <input
                    value={shape2Text}
                    onChange={(e) => updateAttributes({ shape2Text: e.target.value })}
                    placeholder="e.g. S B"
                    className={`${inputClass} flex-1`}
                    style={inputStyle}
                  />
                )}
              </div>
              {shape2Type === "svg" && (
                <div className="space-y-1">
                  <div className="flex gap-2 items-center">
                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value) {
                          updateAttributes({ shape2Svg: e.target.value })
                        }
                      }}
                      className={selectClass}
                      style={inputStyle}
                    >
                      <option value="">Presets…</option>
                      {SVG_PRESETS.map((p) => (
                        <option key={p.label} value={p.d}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <textarea
                    value={shape2Svg}
                    onChange={(e) => updateAttributes({ shape2Svg: e.target.value })}
                    placeholder="M12 2l3.09 6.26L22 9.27…"
                    rows={3}
                    className={`${inputClass} resize-y`}
                    style={{ ...inputStyle, fontFamily: "monospace", fontSize: "10px" }}
                  />
                </div>
              )}
            </div>

            {/* ── Height ── */}
            <div className="space-y-1.5">
              <label
                className="text-[10px] block"
                style={{ color: "var(--text-muted)" }}
              >
                Height (px)
              </label>
              <input
                type="number"
                value={height}
                onChange={(e) =>
                  updateAttributes({ height: Math.max(120, Math.min(600, Number(e.target.value) || 280)) })
                }
                min={120}
                max={600}
                className={inputClass}
                style={inputStyle}
              />
            </div>

            {/* ── Particle Count (range slider) ── */}
            <div className="space-y-1.5">
              <label
                className="text-[10px] flex items-center justify-between"
                style={{ color: "var(--text-muted)" }}
              >
                <span>Particle Count</span>
                <span
                  className="tabular-nums font-medium"
                  style={{ color: "var(--text)" }}
                >
                  {particleCount}
                </span>
              </label>
              <input
                type="range"
                value={particleCount}
                onChange={(e) =>
                  updateAttributes({ particleCount: Number(e.target.value) })
                }
                min={500}
                max={3000}
                step={100}
                className="hero-block__slider w-full"
              />
              <div
                className="flex justify-between text-[9px]"
                style={{ color: "var(--text-muted)", opacity: 0.4 }}
              >
                <span>500</span>
                <span>3000</span>
              </div>
            </div>

            {/* ── Badge ── */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={showBadge}
                  onChange={(e) =>
                    updateAttributes({ showBadge: e.target.checked })
                  }
                  className="rounded"
                />
                <span
                  className="text-[10px]"
                  style={{ color: "var(--text-muted)" }}
                >
                  Show badge
                </span>
              </label>
              {showBadge && (
                <input
                  value={badgeText}
                  onChange={(e) =>
                    updateAttributes({ badgeText: e.target.value })
                  }
                  placeholder="badge text"
                  className="text-xs px-2 py-1.5 rounded-lg outline-none w-full"
                  style={inputStyle}
                />
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ── Read mode ── */
        <div className="hero-block__display">
          <div
            className="relative overflow-hidden rounded-lg"
            style={{
              height: `${height}px`,
              background: "var(--card-bg)",
            }}
          >
            <Particles
              className="absolute inset-0"
              shape1Type={shape1Type}
              shape1Text={shape1Text}
              shape1Svg={shape1Svg}
              shape2Type={shape2Type}
              shape2Text={shape2Text}
              shape2Svg={shape2Svg}
              particleCount={particleCount}
            />
            {showBadge && (
              <div
                className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] pointer-events-none select-none"
                style={{
                  background:
                    "color-mix(in srgb, var(--bg) 70%, transparent)",
                  backdropFilter: "blur(4px)",
                  color: "var(--text-muted)",
                  border: "1px solid var(--border)",
                }}
              >
                {badgeText}
              </div>
            )}
          </div>
        </div>
      )}
    </NodeViewWrapper>
  )
}
