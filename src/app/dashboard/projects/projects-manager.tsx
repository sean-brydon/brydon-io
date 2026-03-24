"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProjectForm } from "./project-form";

interface Project {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  repoUrl: string | null;
  tags: string[] | null;
  featured: boolean;
}

export function ProjectsManager({ projects }: { projects: Project[] }) {
  const router = useRouter();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("delete this project?")) return;
    setDeletingId(id);

    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "failed to delete");
        return;
      }

      router.refresh();
    } catch {
      alert("failed to delete");
    } finally {
      setDeletingId(null);
    }
  }

  function handleSaved() {
    setShowAddForm(false);
    setEditingId(null);
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold mb-1" style={{ color: "var(--text)" }}>projects</h1>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>manage your project showcase</p>
        </div>
        {!showAddForm && (
          <button
            onClick={() => { setShowAddForm(true); setEditingId(null); }}
            className="text-xs px-4 py-2 rounded-lg font-medium transition-opacity hover:opacity-90"
            style={{ background: "var(--accent)", color: "#fff", border: "none", cursor: "pointer" }}
          >
            add project
          </button>
        )}
      </div>

      {showAddForm && (
        <div className="mb-6">
          <ProjectForm
            onSaved={handleSaved}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      )}

      {projects.length === 0 && !showAddForm ? (
        <div className="text-center py-16 rounded-lg" style={{ border: "1px dashed var(--border)" }}>
          <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>no projects yet</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="text-xs"
            style={{ color: "var(--accent)", background: "none", border: "none", cursor: "pointer" }}
          >
            add your first project →
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((project) => (
            <div key={project.id}>
              {editingId === project.id ? (
                <ProjectForm
                  project={project}
                  onSaved={handleSaved}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <div
                  className="p-4 rounded-lg"
                  style={{ background: "var(--card-bg)", border: "1px solid var(--border)" }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>{project.title}</h3>
                      {project.url && (
                        <a href={project.url} target="_blank" rel="noopener noreferrer" className="text-[11px] no-underline" style={{ color: "var(--accent)" }}>
                          {project.url.replace(/^https?:\/\//, "")} ↗
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {project.featured && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "color-mix(in srgb, var(--accent) 15%, transparent)", color: "var(--accent)" }}>
                          featured
                        </span>
                      )}
                      <button
                        onClick={() => { setEditingId(project.id); setShowAddForm(false); }}
                        className="text-[11px] px-2 py-1 rounded transition-opacity hover:opacity-80"
                        style={{ background: "transparent", color: "var(--text-muted)", border: "1px solid var(--border)", cursor: "pointer" }}
                      >
                        edit
                      </button>
                      <button
                        onClick={() => handleDelete(project.id)}
                        disabled={deletingId === project.id}
                        className="text-[11px] px-2 py-1 rounded transition-opacity hover:opacity-80 disabled:opacity-50"
                        style={{ background: "transparent", color: "#ef4444", border: "1px solid color-mix(in srgb, #ef4444 30%, transparent)", cursor: deletingId === project.id ? "not-allowed" : "pointer" }}
                      >
                        {deletingId === project.id ? "..." : "delete"}
                      </button>
                    </div>
                  </div>
                  {project.description && (
                    <p className="text-xs leading-relaxed mb-3" style={{ color: "var(--text-muted)" }}>{project.description}</p>
                  )}
                  {project.tags && (project.tags as string[]).length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {(project.tags as string[]).map((tag) => (
                        <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "var(--card-bg)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
