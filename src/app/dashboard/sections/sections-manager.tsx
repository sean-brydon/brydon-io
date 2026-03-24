"use client";

import { useState, useCallback } from "react";
import {
  CurrentlyEditor,
  TechStackEditor,
  GitHubEditor,
  ContactEditor,
  EducationEditor,
  GalleryEditor,
  CustomEditor,
} from "./editors";

function SectionEditor({ type, config, onChange }: { type: string; config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  switch (type) {
    case "currently": return <CurrentlyEditor config={config} onChange={onChange} />;
    case "tech_stack": return <TechStackEditor config={config} onChange={onChange} />;
    case "github_contributions": return <GitHubEditor config={config} onChange={onChange} />;
    case "contact": return <ContactEditor config={config} onChange={onChange} />;
    case "education": return <EducationEditor config={config} onChange={onChange} />;
    case "gallery": return <GalleryEditor config={config} onChange={onChange} />;
    case "custom": return <CustomEditor config={config} onChange={onChange} />;
    default:
      // Fallback: JSON textarea for unknown types
      return (
        <div>
          <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>config (json)</label>
          <textarea
            value={JSON.stringify(config, null, 2)}
            onChange={(e) => { try { onChange(JSON.parse(e.target.value)); } catch {} }}
            rows={6}
            className="w-full text-xs px-3 py-2.5 rounded-lg outline-none resize-y font-mono"
            style={{ background: "var(--card-bg)", color: "var(--text)", border: "1px solid var(--border)" }}
          />
        </div>
      );
  }
}

/* ─── Types ────────────────────────────────────────────────────────── */

interface Section {
  id: string;
  type: string;
  title: string;
  content: string | null;
  order: number;
  visible: boolean;
  config: Record<string, unknown>;
  createdAt: Date | string;
  updatedAt: Date | string;
}

const SECTION_TYPES = [
  { value: "currently", label: "currently" },
  { value: "tech_stack", label: "tech stack" },
  { value: "education", label: "education" },
  { value: "github_contributions", label: "github contributions" },
  { value: "contact", label: "contact" },
  { value: "custom", label: "custom" },
] as const;

type SectionType = (typeof SECTION_TYPES)[number]["value"];

/* ─── Component ────────────────────────────────────────────────────── */

export default function SectionsManager({
  initialSections,
}: {
  initialSections: Section[];
}) {
  const [sections, setSections] = useState<Section[]>(initialSections);
  const [loading, setLoading] = useState<string | null>(null); // track which action is loading
  const [error, setError] = useState<string | null>(null);

  // ─── Create form state ──────────────────────────────────────────
  const [showCreate, setShowCreate] = useState(false);
  const [newType, setNewType] = useState<SectionType>("custom");
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newConfig, setNewConfig] = useState<Record<string, unknown>>({});

  // ─── Edit state ─────────────────────────────────────────────────
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editConfig, setEditConfig] = useState<Record<string, unknown>>({});

  const clearError = useCallback(() => setError(null), []);

  /* ─── API helpers ──────────────────────────────────────────────── */

  async function apiCall<T>(
    url: string,
    method: string,
    body?: unknown,
  ): Promise<T> {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `Request failed (${res.status})`);
    }
    return res.json();
  }

  /* ─── Reorder ──────────────────────────────────────────────────── */

  async function moveSection(index: number, direction: -1 | 1) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= sections.length) return;

    const reordered = [...sections];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(newIndex, 0, moved);

    // Optimistic update
    const withNewOrder = reordered.map((s, i) => ({ ...s, order: i }));
    setSections(withNewOrder);

    setLoading("reorder");
    clearError();
    try {
      await apiCall("/api/sections/reorder", "PUT", {
        orderedIds: withNewOrder.map((s) => s.id),
      });
    } catch (err) {
      setSections(sections); // rollback
      setError(err instanceof Error ? err.message : "Failed to reorder");
    } finally {
      setLoading(null);
    }
  }

  /* ─── Toggle visibility ────────────────────────────────────────── */

  async function toggleVisibility(section: Section) {
    const newVisible = !section.visible;

    // Optimistic
    setSections((prev) =>
      prev.map((s) => (s.id === section.id ? { ...s, visible: newVisible } : s)),
    );

    setLoading(`vis-${section.id}`);
    clearError();
    try {
      const updated = await apiCall<Section>(
        `/api/sections/${section.id}`,
        "PATCH",
        { visible: newVisible },
      );
      setSections((prev) =>
        prev.map((s) => (s.id === section.id ? updated : s)),
      );
    } catch (err) {
      setSections((prev) =>
        prev.map((s) =>
          s.id === section.id ? { ...s, visible: section.visible } : s,
        ),
      );
      setError(err instanceof Error ? err.message : "Failed to toggle visibility");
    } finally {
      setLoading(null);
    }
  }

  /* ─── Create ───────────────────────────────────────────────────── */

  async function createSection(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setLoading("create");
    clearError();
    try {
      const section = await apiCall<Section>("/api/sections", "POST", {
        type: newType,
        title: newTitle.trim(),
        content: newType === "custom" && newContent.trim() ? newContent.trim() : null,
        config: newConfig,
      });
      setSections((prev) => [...prev, section].sort((a, b) => a.order - b.order));
      setShowCreate(false);
      setNewTitle("");
      setNewContent("");
      setNewConfig({});
      setNewType("custom");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create section");
    } finally {
      setLoading(null);
    }
  }

  /* ─── Edit ─────────────────────────────────────────────────────── */

  function startEditing(section: Section) {
    setEditingId(section.id);
    setEditTitle(section.title);
    setEditContent(section.content ?? "");
    setEditConfig(section.config ?? {});
  }

  function cancelEditing() {
    setEditingId(null);
    setEditTitle("");
    setEditContent("");
    setEditConfig({});
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId || !editTitle.trim()) return;

    setLoading(`edit-${editingId}`);
    clearError();
    try {
      const updated = await apiCall<Section>(
        `/api/sections/${editingId}`,
        "PATCH",
        {
          title: editTitle.trim(),
          content: editContent.trim() || null,
          config: editConfig,
        },
      );
      setSections((prev) => prev.map((s) => (s.id === editingId ? updated : s)));
      cancelEditing();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update section");
    } finally {
      setLoading(null);
    }
  }

  /* ─── Delete ───────────────────────────────────────────────────── */

  async function deleteSection(section: Section) {
    if (!confirm(`Delete "${section.title}"? This cannot be undone.`)) return;

    setLoading(`del-${section.id}`);
    clearError();
    try {
      await apiCall(`/api/sections/${section.id}`, "DELETE");
      setSections((prev) => prev.filter((s) => s.id !== section.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete section");
    } finally {
      setLoading(null);
    }
  }

  /* ─── Render helpers ───────────────────────────────────────────── */

  const inputStyle = {
    background: "var(--card-bg)",
    color: "var(--text)",
    border: "1px solid var(--border)",
  } as const;

  const btnPrimary = {
    background: "var(--accent)",
    color: "#fff",
    border: "none",
    cursor: "pointer",
  } as const;

  const btnGhost = {
    background: "transparent",
    color: "var(--text-muted)",
    border: "1px solid var(--border)",
    cursor: "pointer",
  } as const;

  /* ─── Render ───────────────────────────────────────────────────── */

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold mb-1" style={{ color: "var(--text)" }}>
            sections
          </h1>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            manage your profile sections — reorder, toggle visibility
          </p>
        </div>
        <button
          onClick={() => setShowCreate((v) => !v)}
          className="text-xs px-4 py-2 rounded-lg font-medium transition-opacity hover:opacity-90"
          style={btnPrimary}
        >
          {showCreate ? "cancel" : "add section"}
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div
          className="text-xs px-4 py-2.5 rounded-lg mb-4 flex items-center justify-between"
          style={{
            background: "color-mix(in srgb, #ef4444 12%, transparent)",
            color: "#ef4444",
            border: "1px solid color-mix(in srgb, #ef4444 25%, transparent)",
          }}
        >
          <span>{error}</span>
          <button
            onClick={clearError}
            className="ml-3 text-[10px] hover:opacity-70"
            style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer" }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <form
          onSubmit={createSection}
          className="p-4 rounded-lg mb-6 space-y-4"
          style={{ background: "var(--card-bg)", border: "1px solid var(--border)" }}
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>
                type
              </label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as SectionType)}
                className="w-full text-xs px-3 py-2.5 rounded-lg outline-none"
                style={inputStyle}
              >
                {SECTION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>
                title
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="section title"
                required
                className="w-full text-xs px-3 py-2.5 rounded-lg outline-none"
                style={inputStyle}
              />
            </div>
          </div>

          <SectionEditor type={newType} config={newConfig} onChange={setNewConfig} />

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading === "create"}
              className="text-xs font-medium px-4 py-2 rounded-lg transition-opacity hover:opacity-90 disabled:opacity-50"
              style={btnPrimary}
            >
              {loading === "create" ? "creating..." : "create section"}
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="text-xs font-medium px-4 py-2 rounded-lg transition-colors"
              style={btnGhost}
            >
              cancel
            </button>
          </div>
        </form>
      )}

      {/* Sections list */}
      {sections.length === 0 ? (
        <div
          className="text-center py-16 rounded-lg"
          style={{ border: "1px dashed var(--border)" }}
        >
          <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>
            no sections yet
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="text-xs"
            style={{ color: "var(--accent)", background: "none", border: "none", cursor: "pointer" }}
          >
            add your first section →
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sections.map((section, index) => (
            <div key={section.id}>
              <div
                className="flex items-center justify-between p-4 rounded-lg"
                style={{
                  background: "var(--card-bg)",
                  border: `1px solid ${editingId === section.id ? "var(--accent)" : "var(--border)"}`,
                  opacity: loading?.startsWith(`del-${section.id}`) ? 0.5 : 1,
                  transition: "opacity 150ms, border-color 150ms",
                }}
              >
                {/* Left: reorder + info */}
                <div className="flex items-center gap-3">
                  {/* Move buttons */}
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => moveSection(index, -1)}
                      disabled={index === 0 || loading === "reorder"}
                      className="text-[10px] leading-none px-1 py-0.5 rounded transition-colors disabled:opacity-20"
                      style={{
                        background: "transparent",
                        color: "var(--text-muted)",
                        border: "1px solid var(--border)",
                        cursor: index === 0 ? "default" : "pointer",
                      }}
                      title="Move up"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveSection(index, 1)}
                      disabled={index === sections.length - 1 || loading === "reorder"}
                      className="text-[10px] leading-none px-1 py-0.5 rounded transition-colors disabled:opacity-20"
                      style={{
                        background: "transparent",
                        color: "var(--text-muted)",
                        border: "1px solid var(--border)",
                        cursor: index === sections.length - 1 ? "default" : "pointer",
                      }}
                      title="Move down"
                    >
                      ↓
                    </button>
                  </div>

                  {/* Info */}
                  <div>
                    <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                      {section.title}
                    </h3>
                    <p
                      className="text-[11px]"
                      style={{ color: "var(--text-muted)", opacity: 0.6 }}
                    >
                      {section.type} · order {section.order}
                    </p>
                  </div>
                </div>

                {/* Right: actions */}
                <div className="flex items-center gap-2">
                  {/* Visibility badge / toggle */}
                  <button
                    onClick={() => toggleVisibility(section)}
                    disabled={loading === `vis-${section.id}`}
                    className="text-[10px] px-2 py-0.5 rounded-full transition-colors"
                    style={{
                      background: section.visible
                        ? "color-mix(in srgb, #22c55e 15%, transparent)"
                        : "var(--card-bg)",
                      color: section.visible ? "#22c55e" : "var(--text-muted)",
                      border: `1px solid ${
                        section.visible
                          ? "color-mix(in srgb, #22c55e 30%, transparent)"
                          : "var(--border)"
                      }`,
                      cursor: "pointer",
                    }}
                    title={section.visible ? "Click to hide" : "Click to show"}
                  >
                    {section.visible ? "visible" : "hidden"}
                  </button>

                  {/* Edit button */}
                  <button
                    onClick={() =>
                      editingId === section.id ? cancelEditing() : startEditing(section)
                    }
                    className="text-[10px] px-2 py-0.5 rounded transition-colors"
                    style={{
                      ...btnGhost,
                      color: editingId === section.id ? "var(--accent)" : "var(--text-muted)",
                    }}
                  >
                    {editingId === section.id ? "cancel" : "edit"}
                  </button>

                  {/* Delete button */}
                  <button
                    onClick={() => deleteSection(section)}
                    disabled={loading === `del-${section.id}`}
                    className="text-[10px] px-2 py-0.5 rounded transition-colors hover:opacity-70"
                    style={{
                      background: "transparent",
                      color: "#ef4444",
                      border: "1px solid color-mix(in srgb, #ef4444 30%, transparent)",
                      cursor: "pointer",
                    }}
                  >
                    {loading === `del-${section.id}` ? "..." : "delete"}
                  </button>
                </div>
              </div>

              {/* Inline edit form */}
              {editingId === section.id && (
                <form
                  onSubmit={saveEdit}
                  className="mt-1 p-4 rounded-lg space-y-4"
                  style={{
                    background: "var(--card-bg)",
                    border: "1px solid var(--accent)",
                    borderTop: "none",
                    borderTopLeftRadius: 0,
                    borderTopRightRadius: 0,
                  }}
                >
                  <div>
                    <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>
                      title
                    </label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      required
                      className="w-full text-xs px-3 py-2.5 rounded-lg outline-none"
                      style={inputStyle}
                    />
                  </div>

                  <SectionEditor type={section.type} config={editConfig} onChange={setEditConfig} />

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={loading === `edit-${section.id}`}
                      className="text-xs font-medium px-4 py-2 rounded-lg transition-opacity hover:opacity-90 disabled:opacity-50"
                      style={btnPrimary}
                    >
                      {loading === `edit-${section.id}` ? "saving..." : "save changes"}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEditing}
                      className="text-xs font-medium px-4 py-2 rounded-lg transition-colors"
                      style={btnGhost}
                    >
                      cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
