"use client";

import { useEffect, useState, useCallback } from "react";

type ColorVisionMode = "none" | "protanopia" | "deuteranopia" | "tritanopia" | "achromatopsia";

interface A11yState {
  dyslexicFont: boolean;
  largeText: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
  lineHeight: boolean;
  colorVision: ColorVisionMode;
}

const STORAGE_KEY = "a11y-preferences";

const defaults: A11yState = {
  dyslexicFont: false,
  largeText: false,
  highContrast: false,
  reducedMotion: false,
  lineHeight: false,
  colorVision: "none",
};

const COLOR_VISION_MODES: { value: ColorVisionMode; label: string; description: string }[] = [
  { value: "none", label: "default", description: "no color adjustment" },
  { value: "protanopia", label: "protanopia", description: "red-blind" },
  { value: "deuteranopia", label: "deuteranopia", description: "green-blind" },
  { value: "tritanopia", label: "tritanopia", description: "blue-blind" },
  { value: "achromatopsia", label: "achromatopsia", description: "total color blindness" },
];

export function A11yWidget() {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<A11yState>(defaults);
  const [mounted, setMounted] = useState(false);

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setState({ ...defaults, ...JSON.parse(saved) });
    } catch {}
    setMounted(true);
  }, []);

  // Apply classes to <html>
  useEffect(() => {
    if (!mounted) return;
    const el = document.documentElement;

    el.classList.toggle("a11y-dyslexic", state.dyslexicFont);
    el.classList.toggle("a11y-large-text", state.largeText);
    el.classList.toggle("a11y-high-contrast", state.highContrast);
    el.classList.toggle("a11y-reduced-motion", state.reducedMotion);
    el.classList.toggle("a11y-line-height", state.lineHeight);

    // Color vision filter
    if (state.colorVision !== "none") {
      el.style.filter = `url(#a11y-${state.colorVision})`;
    } else {
      el.style.filter = "";
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state, mounted]);

  const toggle = useCallback((key: keyof A11yState) => {
    setState((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const reset = useCallback(() => {
    setState(defaults);
  }, []);

  const activeCount = Object.values(state).filter((v) => v === true).length + (state.colorVision !== "none" ? 1 : 0);

  if (!mounted) return null;

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-5 z-50 w-10 h-10 rounded-full flex items-center justify-center transition-all"
        style={{
          background: activeCount > 0 ? "var(--accent)" : "var(--card-bg)",
          border: "1px solid var(--border)",
          color: activeCount > 0 ? "#fff" : "var(--text-muted)",
          cursor: "pointer",
          boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
        }}
        aria-label="Accessibility settings"
        aria-expanded={open}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="4.5" r="2.5" />
          <path d="m4.5 9 3 1.5 4.5 1 4.5-1 3-1.5" />
          <path d="M8 14.5 7 21" />
          <path d="M16 14.5 17 21" />
          <path d="m9.5 12.5 2.5 5 2.5-5" />
        </svg>
        {activeCount > 0 && (
          <span
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            {activeCount}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden
          />

          <div
            className="fixed bottom-18 right-5 z-50 w-72 rounded-lg overflow-hidden"
            style={{
              background: "var(--bg)",
              border: "1px solid var(--border)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
            }}
            role="dialog"
            aria-label="Accessibility preferences"
          >
            {/* Header */}
            <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
              <span className="text-xs font-semibold" style={{ color: "var(--text)" }}>
                accessibility
              </span>
              <button
                onClick={reset}
                className="text-[10px] px-2 py-0.5 rounded transition-colors"
                style={{
                  color: "var(--text-muted)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  opacity: activeCount > 0 ? 1 : 0.3,
                }}
                disabled={activeCount === 0}
              >
                reset all
              </button>
            </div>

            {/* Options */}
            <div className="p-2 space-y-0.5">
              <A11yToggle
                label="dyslexia-friendly font"
                description="switches to lexend, a font designed for readability"
                active={state.dyslexicFont}
                onToggle={() => toggle("dyslexicFont")}
                icon={<span className="text-sm font-bold" style={{ fontFamily: "var(--font-dyslexic)" }}>Aa</span>}
              />
              <A11yToggle
                label="larger text"
                description="increases base font size by 20%"
                active={state.largeText}
                onToggle={() => toggle("largeText")}
                icon={<span className="text-sm font-bold">A+</span>}
              />
              <A11yToggle
                label="increased line height"
                description="adds more space between lines of text"
                active={state.lineHeight}
                onToggle={() => toggle("lineHeight")}
                icon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="21" y1="6" x2="9" y2="6" /><line x1="21" y1="12" x2="9" y2="12" /><line x1="21" y1="18" x2="9" y2="18" />
                    <polyline points="4 8 4 4 4 8" /><line x1="4" y1="4" x2="4" y2="20" /><polyline points="4 16 4 20 4 16" />
                  </svg>
                }
              />
              <A11yToggle
                label="high contrast"
                description="increases text contrast for better visibility"
                active={state.highContrast}
                onToggle={() => toggle("highContrast")}
                icon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 2a10 10 0 0 1 0 20z" fill="currentColor" />
                  </svg>
                }
              />
              <A11yToggle
                label="reduce motion"
                description="pauses animations and transitions"
                active={state.reducedMotion}
                onToggle={() => toggle("reducedMotion")}
                icon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <rect x="2" y="6" width="20" height="12" rx="2" />
                    <line x1="8" y1="10" x2="8" y2="14" /><line x1="16" y1="10" x2="16" y2="14" />
                  </svg>
                }
              />
            </div>

            {/* Color vision */}
            <div className="px-4 py-3" style={{ borderTop: "1px solid var(--border)" }}>
              <p className="text-[11px] font-medium mb-2" style={{ color: "var(--text)" }}>
                color vision
              </p>
              <div className="flex flex-wrap gap-1">
                {COLOR_VISION_MODES.map((mode) => {
                  const isActive = state.colorVision === mode.value;
                  return (
                    <button
                      key={mode.value}
                      onClick={() => setState((prev) => ({ ...prev, colorVision: mode.value }))}
                      className="text-[10px] px-2 py-1 rounded-md transition-colors"
                      style={{
                        background: isActive ? "var(--accent)" : "var(--card-bg)",
                        color: isActive ? "#fff" : "var(--text-muted)",
                        border: isActive ? "1px solid var(--accent)" : "1px solid var(--border)",
                        cursor: "pointer",
                      }}
                      title={mode.description}
                      aria-pressed={isActive}
                    >
                      {mode.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* SVG color vision filters — hidden, referenced by CSS filter: url(#id) */}
      <svg className="absolute w-0 h-0" aria-hidden="true">
        <defs>
          {/* Protanopia — red-blind */}
          <filter id="a11y-protanopia">
            <feColorMatrix type="matrix" values="
              0.567, 0.433, 0,     0, 0
              0.558, 0.442, 0,     0, 0
              0,     0.242, 0.758, 0, 0
              0,     0,     0,     1, 0
            " />
          </filter>
          {/* Deuteranopia — green-blind */}
          <filter id="a11y-deuteranopia">
            <feColorMatrix type="matrix" values="
              0.625, 0.375, 0,   0, 0
              0.7,   0.3,   0,   0, 0
              0,     0.3,   0.7, 0, 0
              0,     0,     0,   1, 0
            " />
          </filter>
          {/* Tritanopia — blue-blind */}
          <filter id="a11y-tritanopia">
            <feColorMatrix type="matrix" values="
              0.95, 0.05,  0,     0, 0
              0,    0.433, 0.567, 0, 0
              0,    0.475, 0.525, 0, 0
              0,    0,     0,     1, 0
            " />
          </filter>
          {/* Achromatopsia — total color blindness */}
          <filter id="a11y-achromatopsia">
            <feColorMatrix type="matrix" values="
              0.299, 0.587, 0.114, 0, 0
              0.299, 0.587, 0.114, 0, 0
              0.299, 0.587, 0.114, 0, 0
              0,     0,     0,     1, 0
            " />
          </filter>
        </defs>
      </svg>
    </>
  );
}

function A11yToggle({
  label,
  description,
  active,
  onToggle,
  icon,
}: {
  label: string;
  description: string;
  active: boolean;
  onToggle: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-colors"
      style={{
        background: active ? "color-mix(in srgb, var(--accent) 10%, transparent)" : "transparent",
        border: "none",
        cursor: "pointer",
      }}
      role="switch"
      aria-checked={active}
      aria-label={label}
    >
      <span
        className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
        style={{
          background: active ? "var(--accent)" : "var(--card-bg)",
          color: active ? "#fff" : "var(--text-muted)",
          border: active ? "none" : "1px solid var(--border)",
        }}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium" style={{ color: active ? "var(--accent)" : "var(--text)" }}>
          {label}
        </p>
        <p className="text-[10px]" style={{ color: "var(--text-muted)", opacity: 0.6 }}>
          {description}
        </p>
      </div>
    </button>
  );
}
