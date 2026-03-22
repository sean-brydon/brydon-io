"use client";

import React from "react";

interface CalloutProps {
  type?: "note" | "warning" | "error" | "info";
  children: React.ReactNode;
  title?: string;
}

const config: Record<string, { border: string; label: string; icon: string }> = {
  note:    { border: "var(--accent)",  label: "note",    icon: "→" },
  info:    { border: "var(--accent)",  label: "info",    icon: "i" },
  warning: { border: "#f59e0b",        label: "warning", icon: "!" },
  error:   { border: "#ef4444",        label: "error",   icon: "×" },
};

export default function Callout({ type = "note", children, title }: CalloutProps) {
  const c = config[type] || config.note;

  return (
    <div
      className="my-6 py-3 pl-4 pr-4"
      style={{
        borderLeft: `2px solid ${c.border}`,
        background: "var(--card-bg)",
      }}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span
          className="w-4 h-4 flex items-center justify-center rounded-sm text-[10px] font-bold"
          style={{ background: c.border, color: "#fff" }}
        >
          {c.icon}
        </span>
        <span
          className="text-[11px] font-semibold uppercase tracking-wider"
          style={{ color: c.border }}
        >
          {title || c.label}
        </span>
      </div>
      <div className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
        {children}
      </div>
    </div>
  );
}
