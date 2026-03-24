"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CreateCompanyForm() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const name = (form.get("name") as string).trim();
    const slug = (form.get("slug") as string).trim();
    const description = (form.get("description") as string).trim();
    const logo = (form.get("logo") as string).trim();
    const website = (form.get("website") as string).trim();
    const location = (form.get("location") as string).trim();

    if (!name) {
      setError("company name is required");
      setSaving(false);
      return;
    }

    if (!slug) {
      setError("slug is required");
      setSaving(false);
      return;
    }

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      setError("slug must be lowercase letters, numbers, and hyphens only");
      setSaving(false);
      return;
    }

    const body = {
      name,
      slug,
      description: description || null,
      logo: logo || null,
      website: website || null,
      location: location || null,
    };

    try {
      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "failed to create company");
        return;
      }

      router.refresh();
    } catch {
      setError("failed to create company");
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
        create your company
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="cf-name"
            className="block text-xs mb-1.5"
            style={{ color: "var(--text-muted)" }}
          >
            company name *
          </label>
          <input
            id="cf-name"
            name="name"
            type="text"
            placeholder="Acme Inc."
            className="w-full text-xs px-3 py-2.5 rounded-lg outline-none"
            style={{
              background: "var(--background)",
              color: "var(--text)",
              border: "1px solid var(--border)",
            }}
            onChange={(e) => {
              const slugInput = document.getElementById("cf-slug") as HTMLInputElement;
              if (slugInput && !slugInput.dataset.manual) {
                slugInput.value = generateSlug(e.target.value);
              }
            }}
          />
        </div>
        <div>
          <label
            htmlFor="cf-slug"
            className="block text-xs mb-1.5"
            style={{ color: "var(--text-muted)" }}
          >
            slug *
          </label>
          <input
            id="cf-slug"
            name="slug"
            type="text"
            placeholder="acme-inc"
            className="w-full text-xs px-3 py-2.5 rounded-lg outline-none"
            style={{
              background: "var(--background)",
              color: "var(--text)",
              border: "1px solid var(--border)",
            }}
            onChange={(e) => {
              (e.target as HTMLInputElement).dataset.manual = "true";
            }}
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="cf-description"
          className="block text-xs mb-1.5"
          style={{ color: "var(--text-muted)" }}
        >
          description
        </label>
        <textarea
          id="cf-description"
          name="description"
          rows={3}
          placeholder="tell us about your company..."
          className="w-full text-xs px-3 py-2.5 rounded-lg outline-none resize-y"
          style={{
            background: "var(--background)",
            color: "var(--text)",
            border: "1px solid var(--border)",
          }}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="cf-website"
            className="block text-xs mb-1.5"
            style={{ color: "var(--text-muted)" }}
          >
            website
          </label>
          <input
            id="cf-website"
            name="website"
            type="text"
            placeholder="https://acme.com"
            className="w-full text-xs px-3 py-2.5 rounded-lg outline-none"
            style={{
              background: "var(--background)",
              color: "var(--text)",
              border: "1px solid var(--border)",
            }}
          />
        </div>
        <div>
          <label
            htmlFor="cf-location"
            className="block text-xs mb-1.5"
            style={{ color: "var(--text-muted)" }}
          >
            location
          </label>
          <input
            id="cf-location"
            name="location"
            type="text"
            placeholder="San Francisco, CA"
            className="w-full text-xs px-3 py-2.5 rounded-lg outline-none"
            style={{
              background: "var(--background)",
              color: "var(--text)",
              border: "1px solid var(--border)",
            }}
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="cf-logo"
          className="block text-xs mb-1.5"
          style={{ color: "var(--text-muted)" }}
        >
          logo url
        </label>
        <input
          id="cf-logo"
          name="logo"
          type="text"
          placeholder="https://acme.com/logo.png"
          className="w-full text-xs px-3 py-2.5 rounded-lg outline-none"
          style={{
            background: "var(--background)",
            color: "var(--text)",
            border: "1px solid var(--border)",
          }}
        />
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
          {saving ? "creating..." : "create company"}
        </button>
      </div>
    </form>
  );
}
