"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const TiptapEditor = dynamic(
  () => import("@/components/tiptap-editor").then((m) => m.TiptapEditor),
  { ssr: false, loading: () => <div className="w-full rounded-lg" style={{ ...inputStyle, minHeight: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "0.75rem" }}>loading editor...</div> }
);

interface JobData { id: string; title: string; slug: string; description: string; location: string | null; remotePolicy: string; employmentType: string; experienceLevel: string | null; salaryMin: number | null; salaryMax: number | null; salaryCurrency: string | null; tags: string[] | null; applyUrl: string | null; }

const inputClass = "w-full text-xs px-3 py-2.5 rounded-lg outline-none";
const inputStyle = { background: "var(--card-bg)", color: "var(--text)", border: "1px solid var(--border)" } as const;

function slugify(t: string) { return t.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_]+/g, "-").replace(/-+/g, "-").replace(/^-+|-+$/g, ""); }

export function JobForm({ mode, job, companyId }: { mode: "new" | "edit"; job?: JobData; companyId: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [title, setTitle] = useState(job?.title ?? "");
  const [slug, setSlug] = useState(job?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(mode === "edit");
  const [description, setDescription] = useState(job?.description ?? "");
  const [location, setLocation] = useState(job?.location ?? "");
  const [remotePolicy, setRemotePolicy] = useState(job?.remotePolicy ?? "remote");
  const [employmentType, setEmploymentType] = useState(job?.employmentType ?? "full-time");
  const [experienceLevel, setExperienceLevel] = useState(job?.experienceLevel ?? "");
  const [salaryMin, setSalaryMin] = useState(job?.salaryMin?.toString() ?? "");
  const [salaryMax, setSalaryMax] = useState(job?.salaryMax?.toString() ?? "");
  const [salaryCurrency, setSalaryCurrency] = useState(job?.salaryCurrency ?? "USD");
  const [tags, setTags] = useState((job?.tags ?? []).join(", "));
  const [applyUrl, setApplyUrl] = useState(job?.applyUrl ?? "");

  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    if (!slugEdited) setSlug(slugify(e.target.value));
  }, [slugEdited]);

  async function submit(status: string) {
    setSaving(true); setError("");
    const body = { companyId, title, slug, description, location: location || null, remotePolicy, employmentType, experienceLevel: experienceLevel || null, salaryMin: salaryMin ? parseInt(salaryMin) : null, salaryMax: salaryMax ? parseInt(salaryMax) : null, salaryCurrency, tags: tags.split(",").map(t => t.trim()).filter(Boolean), applyUrl: applyUrl || null, status };
    try {
      const url = mode === "new" ? "/api/jobs" : `/api/jobs/${job!.id}`;
      const method = mode === "new" ? "POST" : "PATCH";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(body) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "failed"); }
      router.push("/dashboard/company/jobs");
      router.refresh();
    } catch (err: any) { setError(err.message); }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-6">
      {error && <p className="text-xs" style={{ color: "#ef4444" }}>{error}</p>}
      <div className="grid grid-cols-2 gap-4">
        <div><label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>title</label><input value={title} onChange={handleTitleChange} className={inputClass} style={inputStyle} required /></div>
        <div><label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>slug</label><input value={slug} onChange={(e) => { setSlug(e.target.value); setSlugEdited(true); }} className={inputClass} style={inputStyle} required /></div>
      </div>
      <div><label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>description</label><TiptapEditor content={description} onChange={setDescription} placeholder="Write the job description..." /></div>
      <div className="grid grid-cols-3 gap-4">
        <div><label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>location</label><input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="london, uk" className={inputClass} style={inputStyle} /></div>
        <div><label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>remote</label><select value={remotePolicy} onChange={(e) => setRemotePolicy(e.target.value)} className={inputClass} style={inputStyle}><option value="remote">remote</option><option value="hybrid">hybrid</option><option value="onsite">onsite</option></select></div>
        <div><label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>type</label><select value={employmentType} onChange={(e) => setEmploymentType(e.target.value)} className={inputClass} style={inputStyle}><option value="full-time">full-time</option><option value="part-time">part-time</option><option value="contract">contract</option><option value="freelance">freelance</option></select></div>
      </div>
      <div className="grid grid-cols-4 gap-4">
        <div><label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>level</label><select value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value)} className={inputClass} style={inputStyle}><option value="">any</option><option value="junior">junior</option><option value="mid">mid</option><option value="senior">senior</option><option value="lead">lead</option><option value="principal">principal</option></select></div>
        <div><label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>salary min</label><input type="number" value={salaryMin} onChange={(e) => setSalaryMin(e.target.value)} placeholder="50000" className={inputClass} style={inputStyle} /></div>
        <div><label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>salary max</label><input type="number" value={salaryMax} onChange={(e) => setSalaryMax(e.target.value)} placeholder="80000" className={inputClass} style={inputStyle} /></div>
        <div><label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>currency</label><select value={salaryCurrency} onChange={(e) => setSalaryCurrency(e.target.value)} className={inputClass} style={inputStyle}><option value="USD">USD</option><option value="GBP">GBP</option><option value="EUR">EUR</option></select></div>
      </div>
      <div><label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>tags (comma separated)</label><input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="react, typescript, next.js" className={inputClass} style={inputStyle} /></div>
      <div><label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>external apply url (leave empty for built-in)</label><input value={applyUrl} onChange={(e) => setApplyUrl(e.target.value)} placeholder="https://yourcompany.com/careers/..." className={inputClass} style={inputStyle} /></div>
      <div className="flex gap-3">
        <button onClick={() => submit("published")} disabled={saving} className="text-xs font-medium px-4 py-2 rounded-lg" style={{ background: "var(--accent)", color: "#fff", border: "none", cursor: "pointer" }}>{saving ? "saving..." : "publish"}</button>
        <button onClick={() => submit("draft")} disabled={saving} className="text-xs font-medium px-4 py-2 rounded-lg" style={{ color: "var(--text-muted)", background: "transparent", border: "1px solid var(--border)", cursor: "pointer" }}>save draft</button>
      </div>
    </div>
  );
}
