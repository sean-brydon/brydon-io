import type { ReactNode } from "react";

// ─── Editor Layout (Full-Page, No Sidebar) ─────────────────────────────────────
// Provides a clean full-viewport layout for the post editor. Auth is already
// handled by the parent dashboard layout.tsx, so this just renders children
// without any chrome.
export default function EditorLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
