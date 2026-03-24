"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Company {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  website: string | null;
  industry: string | null;
  size: string | null;
  location: string | null;
  logo: string | null;
}

const inputClass = "w-full text-xs px-3 py-2.5 rounded-lg outline-none";
const inputStyle = { background: "var(--card-bg)", color: "var(--text)", border: "1px solid var(--border)" };

export function EditCompanyForm({ company }: { company: Company }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    const form = new FormData(e.currentTarget);
    const data = Object.fromEntries(form.entries());
    try {
      const res = await fetch(`/api/companies/${company.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "failed"); }
      setMessage("saved!");
      router.refresh();
      setTimeout(() => setMessage(""), 2000);
    } catch (err: any) { setMessage(err.message); }
    finally { setSaving(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div><label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>name</label><input name="name" defaultValue={company.name} className={inputClass} style={inputStyle} /></div>
        <div><label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>slug</label><input name="slug" defaultValue={company.slug} className={inputClass} style={inputStyle} /></div>
      </div>
      <div><label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>description</label><textarea name="description" rows={3} defaultValue={company.description ?? ""} className={`${inputClass} resize-y`} style={inputStyle} /></div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>website</label><input name="website" defaultValue={company.website ?? ""} className={inputClass} style={inputStyle} /></div>
        <div><label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>logo url</label><input name="logo" defaultValue={company.logo ?? ""} className={inputClass} style={inputStyle} /></div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div><label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>industry</label><input name="industry" defaultValue={company.industry ?? ""} className={inputClass} style={inputStyle} /></div>
        <div><label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>size</label><input name="size" defaultValue={company.size ?? ""} placeholder="11-50" className={inputClass} style={inputStyle} /></div>
        <div><label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>location</label><input name="location" defaultValue={company.location ?? ""} className={inputClass} style={inputStyle} /></div>
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving} className="text-xs font-medium px-4 py-2 rounded-lg transition-opacity hover:opacity-90 disabled:opacity-50" style={{ background: "var(--accent)", color: "#fff", border: "none", cursor: saving ? "not-allowed" : "pointer" }}>
          {saving ? "saving..." : "save"}
        </button>
        {message && <span className="text-xs" style={{ color: message === "saved!" ? "#22c55e" : "#ef4444" }}>{message}</span>}
      </div>
    </form>
  );
}
