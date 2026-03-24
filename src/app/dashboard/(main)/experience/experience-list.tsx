"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ExperienceForm, type WorkExperience } from "./experience-form";

function formatPeriod(start: string, end: string | null): string {
  const s = new Date(start);
  const startStr = `${s.toLocaleString("default", { month: "short" })} ${s.getFullYear()}`;
  if (!end) return `${startStr} — present`;
  const e = new Date(end);
  const endStr = `${e.toLocaleString("default", { month: "short" })} ${e.getFullYear()}`;
  return `${startStr} — ${endStr}`;
}

export function ExperienceList({ initial }: { initial: WorkExperience[] }) {
  const router = useRouter();
  const [experiences, setExperiences] = useState<WorkExperience[]>(initial);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function handleSave(saved: WorkExperience) {
    if (editingId) {
      setExperiences((prev) =>
        prev.map((e) => (e.id === saved.id ? saved : e))
      );
      setEditingId(null);
    } else {
      setExperiences((prev) => [saved, ...prev]);
      setShowForm(false);
    }
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("delete this experience?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/work/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setExperiences((prev) => prev.filter((e) => e.id !== id));
        router.refresh();
      }
    } catch {
      // silent
    } finally {
      setDeletingId(null);
    }
  }

  // Sort experiences by startDate descending
  const sorted = [...experiences].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold mb-1" style={{ color: "var(--text)" }}>
            experience
          </h1>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            manage your work history and timeline
          </p>
        </div>
        {!showForm && !editingId && (
          <button
            onClick={() => setShowForm(true)}
            className="text-xs px-4 py-2 rounded-lg font-medium transition-opacity hover:opacity-90"
            style={{
              background: "var(--accent)",
              color: "#fff",
              border: "none",
              cursor: "pointer",
            }}
          >
            add experience
          </button>
        )}
      </div>

      {showForm && (
        <ExperienceForm
          onSave={handleSave}
          onCancel={() => setShowForm(false)}
        />
      )}

      {sorted.length === 0 && !showForm ? (
        <div
          className="text-center py-16 rounded-lg"
          style={{ border: "1px dashed var(--border)" }}
        >
          <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>
            no experience entries yet
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="text-xs"
            style={{
              color: "var(--accent)",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            add your first role →
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {sorted.map((exp) =>
            editingId === exp.id ? (
              <ExperienceForm
                key={exp.id}
                experience={exp}
                onSave={handleSave}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div
                key={exp.id}
                className="group p-4 rounded-lg"
                style={{
                  background: "var(--card-bg)",
                  border: "1px solid var(--border)",
                }}
              >
                <div className="flex items-baseline justify-between mb-1">
                  <h3
                    className="text-sm font-semibold"
                    style={{ color: "var(--text)" }}
                  >
                    {exp.role}
                    <span
                      style={{ color: "var(--text-muted)", fontWeight: 400 }}
                    >
                      {" "}
                      @{" "}
                    </span>
                    {exp.companyUrl ? (
                      <a
                        href={exp.companyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="no-underline"
                        style={{ color: "var(--accent)" }}
                      >
                        {exp.company}
                      </a>
                    ) : (
                      <span style={{ color: "var(--accent)" }}>
                        {exp.company}
                      </span>
                    )}
                  </h3>

                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEditingId(exp.id)}
                      className="text-[11px] px-2 py-0.5 rounded transition-opacity hover:opacity-80"
                      style={{
                        background: "transparent",
                        color: "var(--text-muted)",
                        border: "1px solid var(--border)",
                        cursor: "pointer",
                      }}
                    >
                      edit
                    </button>
                    <button
                      onClick={() => handleDelete(exp.id)}
                      disabled={deletingId === exp.id}
                      className="text-[11px] px-2 py-0.5 rounded transition-opacity hover:opacity-80 disabled:opacity-50"
                      style={{
                        background: "transparent",
                        color: "#ef4444",
                        border: "1px solid color-mix(in srgb, #ef4444 30%, transparent)",
                        cursor:
                          deletingId === exp.id ? "not-allowed" : "pointer",
                      }}
                    >
                      {deletingId === exp.id ? "..." : "delete"}
                    </button>
                  </div>
                </div>

                <p
                  className="text-[11px] mb-2"
                  style={{ color: "var(--text-muted)", opacity: 0.6 }}
                >
                  {formatPeriod(exp.startDate, exp.endDate)} · {exp.type}
                  {exp.location && ` · ${exp.location}`}
                </p>

                {exp.description && (
                  <p
                    className="text-xs leading-relaxed"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {exp.description}
                  </p>
                )}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
