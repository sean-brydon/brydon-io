"use client";

import { useState } from "react";

interface Project {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  repoUrl: string | null;
  tags: string[] | null;
  featured: boolean;
}

interface ProjectFormProps {
  project?: Project;
  onSaved: () => void;
  onCancel: () => void;
}

export function ProjectForm({ project, onSaved, onCancel }: ProjectFormProps) {
  const isEdit = !!project;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const title = (form.get("title") as string).trim();
    const description = (form.get("description") as string).trim();
    const url = (form.get("url") as string).trim();
    const repoUrl = (form.get("repoUrl") as string).trim();
    const tagsRaw = (form.get("tags") as string).trim();
    const featured = form.get("featured") === "on";

    if (!title) {
      setError("title is required");
      setSaving(false);
      return;
    }

    const tags = tagsRaw
      ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

    const body = {
      title,
      description: description || null,
      url: url || null,
      repoUrl: repoUrl || null,
      tags,
      featured,
    };

    try {
      const res = await fetch(
        isEdit ? `/api/projects/${project.id}` : "/api/projects",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "failed to save");
        return;
      }

      onSaved();
    } catch {
      setError("failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 rounded-lg space-y-4"
      style={{
        background: "var(--card-bg)",
        border: "1px solid var(--accent)",
      }}
    >
      <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>
        {isEdit ? "edit project" : "new project"}
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="pf-title" className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>
            title *
          </label>
          <input
            id="pf-title"
            name="title"
            type="text"
            defaultValue={project?.title ?? ""}
            placeholder="my cool project"
            className="w-full text-xs px-3 py-2.5 rounded-lg outline-none"
            style={{ background: "var(--background)", color: "var(--text)", border: "1px solid var(--border)" }}
          />
        </div>
        <div>
          <label htmlFor="pf-tags" className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>
            tags (comma-separated)
          </label>
          <input
            id="pf-tags"
            name="tags"
            type="text"
            defaultValue={project?.tags?.join(", ") ?? ""}
            placeholder="react, typescript, nextjs"
            className="w-full text-xs px-3 py-2.5 rounded-lg outline-none"
            style={{ background: "var(--background)", color: "var(--text)", border: "1px solid var(--border)" }}
          />
        </div>
      </div>

      <div>
        <label htmlFor="pf-description" className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>
          description
        </label>
        <textarea
          id="pf-description"
          name="description"
          rows={2}
          defaultValue={project?.description ?? ""}
          placeholder="a short description of the project..."
          className="w-full text-xs px-3 py-2.5 rounded-lg outline-none resize-y"
          style={{ background: "var(--background)", color: "var(--text)", border: "1px solid var(--border)" }}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="pf-url" className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>
            project url
          </label>
          <input
            id="pf-url"
            name="url"
            type="text"
            defaultValue={project?.url ?? ""}
            placeholder="https://myproject.com"
            className="w-full text-xs px-3 py-2.5 rounded-lg outline-none"
            style={{ background: "var(--background)", color: "var(--text)", border: "1px solid var(--border)" }}
          />
        </div>
        <div>
          <label htmlFor="pf-repoUrl" className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>
            repo url
          </label>
          <input
            id="pf-repoUrl"
            name="repoUrl"
            type="text"
            defaultValue={project?.repoUrl ?? ""}
            placeholder="https://github.com/..."
            className="w-full text-xs px-3 py-2.5 rounded-lg outline-none"
            style={{ background: "var(--background)", color: "var(--text)", border: "1px solid var(--border)" }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="pf-featured"
          name="featured"
          type="checkbox"
          defaultChecked={project?.featured ?? false}
          className="rounded"
          style={{ accentColor: "var(--accent)" }}
        />
        <label htmlFor="pf-featured" className="text-xs" style={{ color: "var(--text-muted)" }}>
          featured project
        </label>
      </div>

      {error && (
        <p className="text-xs" style={{ color: "#ef4444" }}>
          {error}
        </p>
      )}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={saving}
          className="text-xs font-medium px-4 py-2 rounded-lg transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{
            background: "var(--accent)",
            color: "#fff",
            border: "none",
            cursor: saving ? "not-allowed" : "pointer",
          }}
        >
          {saving ? "saving..." : isEdit ? "update project" : "create project"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="text-xs font-medium px-4 py-2 rounded-lg transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{
            background: "transparent",
            color: "var(--text-muted)",
            border: "1px solid var(--border)",
            cursor: "pointer",
          }}
        >
          cancel
        </button>
      </div>
    </form>
  );
}
