"use client";

import { useState } from "react";

export interface WorkExperience {
  id: string;
  company: string;
  role: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  companyUrl: string | null;
  companyLogo: string | null;
  location: string | null;
  type: string;
  createdAt: string;
  updatedAt: string;
}

interface ExperienceFormProps {
  experience?: WorkExperience | null;
  onSave: (experience: WorkExperience) => void;
  onCancel: () => void;
}

const WORK_TYPES = ["full-time", "part-time", "contract", "freelance"] as const;

/** Convert an ISO date string or Date-like string to "YYYY-MM" for month input */
function toMonthValue(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

/** Convert "YYYY-MM" to an ISO string for the API */
function monthToISO(month: string): string {
  if (!month) return "";
  return new Date(`${month}-01T00:00:00.000Z`).toISOString();
}

export function ExperienceForm({ experience, onSave, onCancel }: ExperienceFormProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [isCurrent, setIsCurrent] = useState(!experience?.endDate);

  const isEdit = !!experience;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const startMonth = form.get("startDate") as string;
    const endMonth = form.get("endDate") as string;

    const payload: Record<string, unknown> = {
      company: form.get("company"),
      role: form.get("role"),
      companyUrl: (form.get("companyUrl") as string) || null,
      description: (form.get("description") as string) || null,
      location: (form.get("location") as string) || null,
      type: form.get("type"),
      startDate: monthToISO(startMonth),
      endDate: isCurrent ? null : endMonth ? monthToISO(endMonth) : null,
    };

    try {
      const url = isEdit ? `/api/work/${experience.id}` : "/api/work";
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "failed to save");
        return;
      }

      const saved = await res.json();
      onSave(saved);
    } catch {
      setError("failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="p-5 rounded-lg mb-6"
      style={{ background: "var(--card-bg)", border: "1px solid var(--border)" }}
    >
      <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text)" }}>
        {isEdit ? "edit experience" : "add experience"}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="company *"
            name="company"
            defaultValue={experience?.company ?? ""}
            placeholder="Acme Corp"
            required
          />
          <Field
            label="role *"
            name="role"
            defaultValue={experience?.role ?? ""}
            placeholder="Software Engineer"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field
            label="company url"
            name="companyUrl"
            defaultValue={experience?.companyUrl ?? ""}
            placeholder="https://acme.com"
          />
          <Field
            label="location"
            name="location"
            defaultValue={experience?.location ?? ""}
            placeholder="London, UK"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="startDate" className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>
              start date *
            </label>
            <input
              id="startDate"
              name="startDate"
              type="month"
              required
              defaultValue={toMonthValue(experience?.startDate)}
              className="w-full text-xs px-3 py-2.5 rounded-lg outline-none"
              style={{ background: "var(--card-bg)", color: "var(--text)", border: "1px solid var(--border)" }}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="endDate" className="text-xs" style={{ color: "var(--text-muted)" }}>
                end date
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isCurrent}
                  onChange={(e) => setIsCurrent(e.target.checked)}
                  className="accent-[var(--accent)]"
                  style={{ width: 12, height: 12 }}
                />
                <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>current</span>
              </label>
            </div>
            <input
              id="endDate"
              name="endDate"
              type="month"
              disabled={isCurrent}
              defaultValue={toMonthValue(experience?.endDate)}
              className="w-full text-xs px-3 py-2.5 rounded-lg outline-none disabled:opacity-40"
              style={{ background: "var(--card-bg)", color: "var(--text)", border: "1px solid var(--border)" }}
            />
          </div>
        </div>

        <div>
          <label htmlFor="type" className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>
            type
          </label>
          <select
            id="type"
            name="type"
            defaultValue={experience?.type ?? "full-time"}
            className="w-full text-xs px-3 py-2.5 rounded-lg outline-none"
            style={{ background: "var(--card-bg)", color: "var(--text)", border: "1px solid var(--border)" }}
          >
            {WORK_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="description" className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>
            description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={experience?.description ?? ""}
            placeholder="what did you do?"
            className="w-full text-xs px-3 py-2.5 rounded-lg outline-none resize-y"
            style={{ background: "var(--card-bg)", color: "var(--text)", border: "1px solid var(--border)" }}
          />
        </div>

        <div className="flex items-center gap-3">
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
            {saving ? "saving..." : isEdit ? "update" : "add"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="text-xs font-medium px-4 py-2 rounded-lg transition-opacity hover:opacity-80"
            style={{
              background: "transparent",
              color: "var(--text-muted)",
              border: "1px solid var(--border)",
              cursor: "pointer",
            }}
          >
            cancel
          </button>
          {error && (
            <span className="text-xs" style={{ color: "#ef4444" }}>
              {error}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  placeholder,
  required,
}: {
  label: string;
  name: string;
  defaultValue: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type="text"
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        className="w-full text-xs px-3 py-2.5 rounded-lg outline-none"
        style={{ background: "var(--card-bg)", color: "var(--text)", border: "1px solid var(--border)" }}
      />
    </div>
  );
}
