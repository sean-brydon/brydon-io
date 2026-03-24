"use client";

import { useState } from "react";

interface User {
  name: string;
  username: string | null;
  bio: string | null;
  headline: string | null;
  location: string | null;
  githubUsername: string | null;
  twitterUsername: string | null;
  websiteUrl: string | null;
}

export function SettingsForm({ user }: { user: User }) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const form = new FormData(e.currentTarget);
    const data = Object.fromEntries(form.entries());

    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        setMessage(err.error || "failed to save");
      } else {
        setMessage("saved!");
        setTimeout(() => setMessage(""), 2000);
      }
    } catch {
      setMessage("failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section>
      <h2 className="text-xs uppercase tracking-wider mb-4" style={{ color: "var(--text-muted)", opacity: 0.5 }}>
        profile
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="display name" name="name" defaultValue={user.name} />
          <Field label="username" name="username" defaultValue={user.username ?? ""} />
        </div>

        <Field label="headline" name="headline" defaultValue={user.headline ?? ""} placeholder="software engineer @ ..." />
        <Field label="location" name="location" defaultValue={user.location ?? ""} placeholder="newcastle, england" />

        <div>
          <label htmlFor="bio" className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>bio</label>
          <textarea
            id="bio"
            name="bio"
            rows={3}
            defaultValue={user.bio ?? ""}
            placeholder="developer from..."
            className="w-full text-xs px-3 py-2.5 rounded-lg outline-none resize-y"
            style={{ background: "var(--card-bg)", color: "var(--text)", border: "1px solid var(--border)" }}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="github username" name="githubUsername" defaultValue={user.githubUsername ?? ""} />
          <Field label="x / twitter" name="twitterUsername" defaultValue={user.twitterUsername ?? ""} />
        </div>

        <Field label="website" name="websiteUrl" defaultValue={user.websiteUrl ?? ""} placeholder="https://..." />

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="text-xs font-medium px-4 py-2 rounded-lg transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: "var(--accent)", color: "#fff", border: "none", cursor: saving ? "not-allowed" : "pointer" }}
          >
            {saving ? "saving..." : "save profile"}
          </button>
          {message && (
            <span className="text-xs" style={{ color: message === "saved!" ? "#22c55e" : "#ef4444" }}>{message}</span>
          )}
        </div>
      </form>
    </section>
  );
}

function Field({ label, name, defaultValue, placeholder }: { label: string; name: string; defaultValue: string; placeholder?: string }) {
  return (
    <div>
      <label htmlFor={name} className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>{label}</label>
      <input
        id={name}
        name={name}
        type="text"
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full text-xs px-3 py-2.5 rounded-lg outline-none"
        style={{ background: "var(--card-bg)", color: "var(--text)", border: "1px solid var(--border)" }}
      />
    </div>
  );
}
