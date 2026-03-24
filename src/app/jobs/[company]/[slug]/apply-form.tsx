"use client";

import { useState } from "react";
import { useSession } from "@/lib/auth-client";

export function ApplyForm({ jobId }: { jobId: string }) {
  const { data: session } = useSession();
  const [coverLetter, setCoverLetter] = useState("");
  const [loading, setLoading] = useState(false);
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState("");

  if (!session) {
    return (
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
        <a href="/sign-in" className="no-underline" style={{ color: "var(--accent)" }}>sign in</a> to apply with your devl profile.
      </p>
    );
  }

  if (applied) {
    return (
      <div className="p-4 rounded-lg" style={{ background: "color-mix(in srgb, #22c55e 10%, transparent)", border: "1px solid color-mix(in srgb, #22c55e 30%, transparent)" }}>
        <p className="text-xs" style={{ color: "#22c55e" }}>✓ application submitted! your devl profile has been shared with the company.</p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/jobs/${jobId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ coverLetter: coverLetter.trim() || undefined }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "failed to apply");
      }
      setApplied(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
        your devl profile (bio, projects, work experience, blog posts) will be shared as your application.
      </p>
      <div>
        <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>cover letter (optional)</label>
        <textarea
          value={coverLetter}
          onChange={(e) => setCoverLetter(e.target.value)}
          rows={4}
          placeholder="why you're interested..."
          className="w-full text-xs px-3 py-2.5 rounded-lg outline-none resize-y font-mono"
          style={{ background: "var(--card-bg)", color: "var(--text)", border: "1px solid var(--border)" }}
        />
      </div>
      {error && <p className="text-xs" style={{ color: "#ef4444" }}>{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="text-xs font-medium px-5 py-2.5 rounded-lg transition-opacity hover:opacity-90 disabled:opacity-50"
        style={{ background: "var(--accent)", color: "#fff", border: "none", cursor: loading ? "not-allowed" : "pointer" }}
      >
        {loading ? "applying..." : "apply with your devl profile"}
      </button>
    </form>
  );
}
