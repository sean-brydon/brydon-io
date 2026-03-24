export interface SectionEditorProps {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}

export const inputStyle = {
  background: "var(--card-bg)",
  color: "var(--text)",
  border: "1px solid var(--border)",
} as const;

export const inputClass = "w-full text-xs px-3 py-2.5 rounded-lg outline-none";
