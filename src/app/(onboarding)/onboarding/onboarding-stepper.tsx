"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// ─── Types ──────────────────────────────────────────────────────────────

interface OnboardingStepperProps {
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
}

interface ProfileData {
  name: string;
  username: string;
  headline: string;
  bio: string;
  location: string;
  githubUsername: string;
  twitterUsername: string;
  websiteUrl: string;
  image: string;
}

interface WorkEntry {
  company: string;
  role: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  type: string;
  isCurrent: boolean;
}

interface ProjectEntry {
  title: string;
  description: string;
  url: string;
  tags: string;
}

interface TechGroup {
  label: string;
  skills: string[];
}

interface CurrentlyCategory {
  label: string;
  items: { name: string; detail: string }[];
}

// ─── Constants ──────────────────────────────────────────────────────────

const STEPS = [
  { label: "about you", icon: "👤" },
  { label: "experience", icon: "💼" },
  { label: "projects", icon: "🚀" },
  { label: "stack & interests", icon: "⚡" },
] as const;

const WORK_TYPES = ["full-time", "part-time", "contract", "freelance"] as const;

const inputClass = "w-full text-xs px-3 py-2.5 rounded-lg outline-none";
const inputStyle = {
  background: "var(--card-bg)",
  color: "var(--text)",
  border: "1px solid var(--border)",
};

function emptyWorkEntry(): WorkEntry {
  return { company: "", role: "", description: "", startDate: "", endDate: "", location: "", type: "full-time", isCurrent: true };
}

function emptyProjectEntry(): ProjectEntry {
  return { title: "", description: "", url: "", tags: "" };
}

// ─── Helpers ────────────────────────────────────────────────────────────

function monthToISO(month: string): string {
  if (!month) return "";
  return new Date(`${month}-01T00:00:00.000Z`).toISOString();
}

async function apiCall(url: string, method: string, body: Record<string, unknown>) {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "request failed" }));
    throw new Error(err.error || "request failed");
  }
  return res.json();
}

// ─── Main Component ────────────────────────────────────────────────────

export function OnboardingStepper({ user }: OnboardingStepperProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [completed, setCompleted] = useState(false);
  const [savedUsername, setSavedUsername] = useState("");

  // Step 1 state
  const [profile, setProfile] = useState<ProfileData>({
    name: user.name || "",
    username: "",
    headline: "",
    bio: "",
    location: "",
    githubUsername: "",
    twitterUsername: "",
    websiteUrl: "",
    image: user.image || "",
  });

  // Step 2 state
  const [workEntries, setWorkEntries] = useState<WorkEntry[]>([emptyWorkEntry()]);

  // Step 3 state
  const [projectEntries, setProjectEntries] = useState<ProjectEntry[]>([emptyProjectEntry()]);

  // Step 4 state
  const [techGroups, setTechGroups] = useState<TechGroup[]>([
    { label: "languages", skills: [] },
    { label: "frameworks", skills: [] },
  ]);
  const [currentlyCategories, setCurrentlyCategories] = useState<CurrentlyCategory[]>([
    { label: "learning", items: [{ name: "", detail: "" }] },
  ]);
  const [techInputs, setTechInputs] = useState<Record<number, string>>({});

  // ── Navigation ──────────────────────────────────────────────────────

  function goNext() {
    setDirection("forward");
    setError("");
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function goBack() {
    setDirection("backward");
    setError("");
    setStep((s) => Math.max(s - 1, 0));
  }

  // ── Step 1: Save profile ────────────────────────────────────────────

  async function saveProfile() {
    setSaving(true);
    setError("");
    try {
      const payload: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(profile)) {
        if (v) payload[k] = v;
      }
      if (!payload.name) {
        setError("name is required");
        setSaving(false);
        return;
      }
      await apiCall("/api/users/me", "PATCH", payload);
      setSavedUsername(profile.username || "");
      goNext();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  // ── Step 2: Save work entries ──────────────────────────────────────

  async function saveWork() {
    setSaving(true);
    setError("");
    try {
      const valid = workEntries.filter((w) => w.company && w.role && w.startDate);
      for (const entry of valid) {
        await apiCall("/api/work", "POST", {
          company: entry.company,
          role: entry.role,
          description: entry.description || null,
          startDate: monthToISO(entry.startDate),
          endDate: entry.isCurrent ? null : entry.endDate ? monthToISO(entry.endDate) : null,
          location: entry.location || null,
          type: entry.type,
        });
      }
      goNext();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "failed to save experience");
    } finally {
      setSaving(false);
    }
  }

  // ── Step 3: Save projects ─────────────────────────────────────────

  async function saveProjects() {
    setSaving(true);
    setError("");
    try {
      const valid = projectEntries.filter((p) => p.title.trim());
      for (const entry of valid) {
        const tags = entry.tags
          ? entry.tags.split(",").map((t) => t.trim()).filter(Boolean)
          : [];
        await apiCall("/api/projects", "POST", {
          title: entry.title.trim(),
          description: entry.description || null,
          url: entry.url || null,
          tags,
        });
      }
      goNext();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "failed to save projects");
    } finally {
      setSaving(false);
    }
  }

  // ── Step 4: Save stack & interests ────────────────────────────────

  async function saveStackAndFinish() {
    setSaving(true);
    setError("");
    try {
      // Save tech stack section
      const validGroups = techGroups.filter((g) => g.label && g.skills.length > 0);
      if (validGroups.length > 0) {
        await apiCall("/api/sections", "POST", {
          type: "tech_stack",
          title: "Tech Stack",
          config: { groups: validGroups },
        });
      }

      // Save currently section
      const validCategories = currentlyCategories
        .map((c) => ({
          ...c,
          items: c.items.filter((i) => i.name.trim()),
        }))
        .filter((c) => c.label && c.items.length > 0);

      if (validCategories.length > 0) {
        await apiCall("/api/sections", "POST", {
          type: "currently",
          title: "Currently",
          config: { categories: validCategories },
        });
      }

      // Generate a default profileHtml with tiptap data blocks.
      // Always set profileHtml (even if empty) to mark onboarding as complete.
      // The server-side completion check in page.tsx relies on profileHtml being
      // non-null to detect that the user has finished onboarding.
      const profileHtml = generateDefaultProfileHtml(validGroups, validCategories) || "";
      await apiCall("/api/users/me", "PATCH", { profileHtml });

      setCompleted(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "failed to save");
    } finally {
      setSaving(false);
    }
  }

  // ── Handle primary action ─────────────────────────────────────────

  function handleNext() {
    if (step === 0) saveProfile();
    else if (step === 1) saveWork();
    else if (step === 2) saveProjects();
    else if (step === 3) saveStackAndFinish();
  }

  async function handleSkip() {
    setError("");
    if (step === 3) {
      // Skip means finish without saving stack, but still mark onboarding
      // as complete by setting profileHtml to a non-null value. Without this,
      // the server-side completion check in page.tsx would not detect the user
      // as having finished onboarding, causing an infinite loop.
      setSaving(true);
      try {
        await apiCall("/api/users/me", "PATCH", { profileHtml: "" });
        setCompleted(true);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "failed to complete onboarding");
      } finally {
        setSaving(false);
      }
    } else {
      goNext();
    }
  }

  // ── Completion auto-redirect ──────────────────────────────────────

  useEffect(() => {
    if (!completed) return;
    const t = setTimeout(() => {
      router.push("/dashboard");
    }, 3000);
    return () => clearTimeout(t);
  }, [completed, router]);

  // ── Completion Screen ─────────────────────────────────────────────

  if (completed) {
    return <CompletionScreen username={savedUsername} />;
  }

  // ── Render ────────────────────────────────────────────────────────

  const isSkippable = step > 0;
  const canGoBack = step > 0;

  return (
    <div className="w-full max-w-[540px] mx-auto">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          {STEPS.map((s, i) => (
            <button
              key={i}
              onClick={() => {
                if (i < step) {
                  setDirection("backward");
                  setStep(i);
                }
              }}
              className="flex flex-col items-center gap-1 group"
              style={{ cursor: i < step ? "pointer" : "default" }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all duration-300"
                style={{
                  background: i <= step ? "var(--accent)" : "var(--card-bg)",
                  color: i <= step ? "#fff" : "var(--text-muted)",
                  border: i <= step ? "2px solid var(--accent)" : "2px solid var(--border)",
                  transform: i === step ? "scale(1.1)" : "scale(1)",
                }}
              >
                {i < step ? "✓" : s.icon}
              </div>
              <span
                className="text-[10px] transition-colors duration-300"
                style={{ color: i <= step ? "var(--text)" : "var(--text-muted)" }}
              >
                {s.label}
              </span>
            </button>
          ))}
        </div>

        {/* Progress track */}
        <div
          className="h-1 rounded-full overflow-hidden"
          style={{ background: "var(--border)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              background: "var(--accent)",
              width: `${((step + 1) / STEPS.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Step content — animated */}
      <div
        className="transition-all duration-300 ease-out"
        style={{
          animation: `${direction === "forward" ? "slideInRight" : "slideInLeft"} 0.3s ease-out`,
        }}
        key={step}
      >
        {step === 0 && (
          <StepAboutYou profile={profile} setProfile={setProfile} />
        )}
        {step === 1 && (
          <StepWorkExperience entries={workEntries} setEntries={setWorkEntries} />
        )}
        {step === 2 && (
          <StepProjects entries={projectEntries} setEntries={setProjectEntries} />
        )}
        {step === 3 && (
          <StepStackInterests
            techGroups={techGroups}
            setTechGroups={setTechGroups}
            techInputs={techInputs}
            setTechInputs={setTechInputs}
            currentlyCategories={currentlyCategories}
            setCurrentlyCategories={setCurrentlyCategories}
          />
        )}
      </div>

      {/* Error */}
      {error && (
        <div
          className="mt-4 text-xs px-3 py-2 rounded-lg"
          style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}
        >
          {error}
        </div>
      )}

      {/* Navigation buttons */}
      <div className="mt-8 flex items-center justify-between">
        <div>
          {canGoBack && (
            <button
              onClick={goBack}
              disabled={saving}
              className="text-xs font-medium px-4 py-2 rounded-lg transition-opacity hover:opacity-80 disabled:opacity-50"
              style={{
                background: "transparent",
                color: "var(--text-muted)",
                border: "1px solid var(--border)",
                cursor: saving ? "not-allowed" : "pointer",
              }}
            >
              ← back
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {isSkippable && (
            <button
              onClick={handleSkip}
              disabled={saving}
              className="text-xs font-medium px-4 py-2 rounded-lg transition-opacity hover:opacity-80 disabled:opacity-50"
              style={{
                background: "transparent",
                color: "var(--text-muted)",
                border: "none",
                cursor: saving ? "not-allowed" : "pointer",
              }}
            >
              skip
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={saving}
            className="text-xs font-medium px-5 py-2.5 rounded-lg transition-all hover:opacity-90 disabled:opacity-50"
            style={{
              background: "var(--accent)",
              color: "#fff",
              border: "none",
              cursor: saving ? "not-allowed" : "pointer",
              boxShadow: "0 2px 8px rgba(99,102,241,0.3)",
            }}
          >
            {saving
              ? "saving..."
              : step === STEPS.length - 1
              ? "finish setup ✨"
              : "continue →"}
          </button>
        </div>
      </div>

      {/* Slide animation keyframes */}
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

// ─── Step 1: About You ──────────────────────────────────────────────────

function StepAboutYou({
  profile,
  setProfile,
}: {
  profile: ProfileData;
  setProfile: React.Dispatch<React.SetStateAction<ProfileData>>;
}) {
  function update(field: keyof ProfileData, value: string) {
    setProfile((p) => ({ ...p, [field]: value }));
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-1" style={{ color: "var(--text)" }}>
        about you
      </h2>
      <p className="text-xs mb-6" style={{ color: "var(--text-muted)" }}>
        tell us a bit about yourself — this will appear on your profile.
      </p>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="display name *" value={profile.name} onChange={(v) => update("name", v)} placeholder="Jane Doe" />
          <Field label="username" value={profile.username} onChange={(v) => update("username", v)} placeholder="janedoe" />
        </div>

        <Field label="headline" value={profile.headline} onChange={(v) => update("headline", v)} placeholder="software engineer @ acme" />
        <Field label="location" value={profile.location} onChange={(v) => update("location", v)} placeholder="san francisco, ca" />

        <div>
          <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>bio</label>
          <textarea
            value={profile.bio}
            onChange={(e) => update("bio", e.target.value)}
            rows={3}
            placeholder="a little about you..."
            className={`${inputClass} resize-y`}
            style={inputStyle}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="github username" value={profile.githubUsername} onChange={(v) => update("githubUsername", v)} placeholder="janedoe" />
          <Field label="x / twitter" value={profile.twitterUsername} onChange={(v) => update("twitterUsername", v)} placeholder="janedoe" />
        </div>

        <Field label="website" value={profile.websiteUrl} onChange={(v) => update("websiteUrl", v)} placeholder="https://janedoe.dev" />

        <Field label="profile image url" value={profile.image} onChange={(v) => update("image", v)} placeholder="https://..." />
      </div>
    </div>
  );
}

// ─── Step 2: Work Experience ────────────────────────────────────────────

function StepWorkExperience({
  entries,
  setEntries,
}: {
  entries: WorkEntry[];
  setEntries: React.Dispatch<React.SetStateAction<WorkEntry[]>>;
}) {
  function updateEntry(idx: number, patch: Partial<WorkEntry>) {
    setEntries((prev) => prev.map((e, i) => (i === idx ? { ...e, ...patch } : e)));
  }

  function removeEntry(idx: number) {
    setEntries((prev) => prev.filter((_, i) => i !== idx));
  }

  function addEntry() {
    setEntries((prev) => [...prev, emptyWorkEntry()]);
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-1" style={{ color: "var(--text)" }}>
        work experience
      </h2>
      <p className="text-xs mb-6" style={{ color: "var(--text-muted)" }}>
        add your work history — you can always edit this later.
      </p>

      <div className="space-y-4">
        {entries.map((entry, idx) => (
          <div
            key={idx}
            className="p-4 rounded-lg space-y-3"
            style={{ background: "var(--card-bg)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-muted)", opacity: 0.5 }}>
                experience {idx + 1}
              </span>
              {entries.length > 1 && (
                <button
                  onClick={() => removeEntry(idx)}
                  className="text-[10px] px-2 py-0.5 rounded"
                  style={{ color: "#ef4444", background: "none", border: "1px solid rgba(239,68,68,0.2)", cursor: "pointer" }}
                >
                  remove
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field
                label="company *"
                value={entry.company}
                onChange={(v) => updateEntry(idx, { company: v })}
                placeholder="Acme Corp"
              />
              <Field
                label="role *"
                value={entry.role}
                onChange={(v) => updateEntry(idx, { role: v })}
                placeholder="Software Engineer"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field
                label="location"
                value={entry.location}
                onChange={(v) => updateEntry(idx, { location: v })}
                placeholder="London, UK"
              />
              <div>
                <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>type</label>
                <select
                  value={entry.type}
                  onChange={(e) => updateEntry(idx, { type: e.target.value })}
                  className={inputClass}
                  style={inputStyle}
                >
                  {WORK_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>start date *</label>
                <input
                  type="month"
                  value={entry.startDate}
                  onChange={(e) => updateEntry(idx, { startDate: e.target.value })}
                  className={inputClass}
                  style={inputStyle}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs" style={{ color: "var(--text-muted)" }}>end date</label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={entry.isCurrent}
                      onChange={(e) => updateEntry(idx, { isCurrent: e.target.checked })}
                      className="accent-[var(--accent)]"
                      style={{ width: 12, height: 12 }}
                    />
                    <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>current</span>
                  </label>
                </div>
                <input
                  type="month"
                  value={entry.endDate}
                  onChange={(e) => updateEntry(idx, { endDate: e.target.value })}
                  disabled={entry.isCurrent}
                  className={`${inputClass} disabled:opacity-40`}
                  style={inputStyle}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>description</label>
              <textarea
                value={entry.description}
                onChange={(e) => updateEntry(idx, { description: e.target.value })}
                rows={2}
                placeholder="what did you do?"
                className={`${inputClass} resize-y`}
                style={inputStyle}
              />
            </div>
          </div>
        ))}

        <button
          onClick={addEntry}
          className="w-full text-xs font-medium px-4 py-2.5 rounded-lg transition-opacity hover:opacity-80"
          style={{ color: "var(--accent)", background: "none", border: "1px dashed var(--border)", cursor: "pointer" }}
        >
          + add another experience
        </button>
      </div>
    </div>
  );
}

// ─── Step 3: Projects ──────────────────────────────────────────────────

function StepProjects({
  entries,
  setEntries,
}: {
  entries: ProjectEntry[];
  setEntries: React.Dispatch<React.SetStateAction<ProjectEntry[]>>;
}) {
  function updateEntry(idx: number, patch: Partial<ProjectEntry>) {
    setEntries((prev) => prev.map((e, i) => (i === idx ? { ...e, ...patch } : e)));
  }

  function removeEntry(idx: number) {
    setEntries((prev) => prev.filter((_, i) => i !== idx));
  }

  function addEntry() {
    setEntries((prev) => [...prev, emptyProjectEntry()]);
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-1" style={{ color: "var(--text)" }}>
        projects
      </h2>
      <p className="text-xs mb-6" style={{ color: "var(--text-muted)" }}>
        showcase your best work — add projects you&#39;re proud of.
      </p>

      <div className="space-y-4">
        {entries.map((entry, idx) => (
          <div
            key={idx}
            className="p-4 rounded-lg space-y-3"
            style={{ background: "var(--card-bg)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-muted)", opacity: 0.5 }}>
                project {idx + 1}
              </span>
              {entries.length > 1 && (
                <button
                  onClick={() => removeEntry(idx)}
                  className="text-[10px] px-2 py-0.5 rounded"
                  style={{ color: "#ef4444", background: "none", border: "1px solid rgba(239,68,68,0.2)", cursor: "pointer" }}
                >
                  remove
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field
                label="title *"
                value={entry.title}
                onChange={(v) => updateEntry(idx, { title: v })}
                placeholder="my cool project"
              />
              <Field
                label="tags (comma-separated)"
                value={entry.tags}
                onChange={(v) => updateEntry(idx, { tags: v })}
                placeholder="react, nextjs, typescript"
              />
            </div>

            <div>
              <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>description</label>
              <textarea
                value={entry.description}
                onChange={(e) => updateEntry(idx, { description: e.target.value })}
                rows={2}
                placeholder="a short description..."
                className={`${inputClass} resize-y`}
                style={inputStyle}
              />
            </div>

            <Field
              label="project url"
              value={entry.url}
              onChange={(v) => updateEntry(idx, { url: v })}
              placeholder="https://myproject.com"
            />
          </div>
        ))}

        <button
          onClick={addEntry}
          className="w-full text-xs font-medium px-4 py-2.5 rounded-lg transition-opacity hover:opacity-80"
          style={{ color: "var(--accent)", background: "none", border: "1px dashed var(--border)", cursor: "pointer" }}
        >
          + add another project
        </button>
      </div>
    </div>
  );
}

// ─── Step 4: Stack & Interests ─────────────────────────────────────────

function StepStackInterests({
  techGroups,
  setTechGroups,
  techInputs,
  setTechInputs,
  currentlyCategories,
  setCurrentlyCategories,
}: {
  techGroups: TechGroup[];
  setTechGroups: React.Dispatch<React.SetStateAction<TechGroup[]>>;
  techInputs: Record<number, string>;
  setTechInputs: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  currentlyCategories: CurrentlyCategory[];
  setCurrentlyCategories: React.Dispatch<React.SetStateAction<CurrentlyCategory[]>>;
}) {
  function updateGroup(idx: number, patch: Partial<TechGroup>) {
    setTechGroups((prev) => prev.map((g, i) => (i === idx ? { ...g, ...patch } : g)));
  }

  function addSkill(gi: number) {
    const val = (techInputs[gi] ?? "").trim();
    if (!val) return;
    setTechGroups((prev) =>
      prev.map((g, i) => (i === gi ? { ...g, skills: [...g.skills, val] } : g))
    );
    setTechInputs((prev) => ({ ...prev, [gi]: "" }));
  }

  function removeSkill(gi: number, si: number) {
    setTechGroups((prev) =>
      prev.map((g, i) => (i === gi ? { ...g, skills: g.skills.filter((_, j) => j !== si) } : g))
    );
  }

  function removeGroup(idx: number) {
    setTechGroups((prev) => prev.filter((_, i) => i !== idx));
  }

  function addGroup() {
    setTechGroups((prev) => [...prev, { label: "", skills: [] }]);
  }

  function updateCategory(idx: number, patch: Partial<CurrentlyCategory>) {
    setCurrentlyCategories((prev) => prev.map((c, i) => (i === idx ? { ...c, ...patch } : c)));
  }

  function updateCategoryItem(catIdx: number, itemIdx: number, patch: Partial<{ name: string; detail: string }>) {
    setCurrentlyCategories((prev) =>
      prev.map((c, ci) =>
        ci === catIdx
          ? { ...c, items: c.items.map((item, ii) => (ii === itemIdx ? { ...item, ...patch } : item)) }
          : c
      )
    );
  }

  function addCategoryItem(catIdx: number) {
    setCurrentlyCategories((prev) =>
      prev.map((c, i) => (i === catIdx ? { ...c, items: [...c.items, { name: "", detail: "" }] } : c))
    );
  }

  function removeCategoryItem(catIdx: number, itemIdx: number) {
    setCurrentlyCategories((prev) =>
      prev.map((c, ci) =>
        ci === catIdx ? { ...c, items: c.items.filter((_, ii) => ii !== itemIdx) } : c
      )
    );
  }

  function removeCategory(idx: number) {
    setCurrentlyCategories((prev) => prev.filter((_, i) => i !== idx));
  }

  function addCategory() {
    setCurrentlyCategories((prev) => [...prev, { label: "", items: [{ name: "", detail: "" }] }]);
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-1" style={{ color: "var(--text)" }}>
        stack & interests
      </h2>
      <p className="text-xs mb-6" style={{ color: "var(--text-muted)" }}>
        what technologies do you use? what are you currently into?
      </p>

      {/* Tech Stack */}
      <div className="mb-6">
        <h3 className="text-xs uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)", opacity: 0.5 }}>
          tech stack
        </h3>

        <div className="space-y-3">
          {techGroups.map((group, gi) => (
            <div
              key={gi}
              className="p-3 rounded-lg"
              style={{ border: "1px solid var(--border)" }}
            >
              <div className="flex items-center justify-between mb-2">
                <input
                  value={group.label}
                  onChange={(e) => updateGroup(gi, { label: e.target.value })}
                  placeholder="group label (e.g. languages)"
                  className="text-xs px-2 py-1.5 rounded-lg outline-none flex-1"
                  style={inputStyle}
                />
                <button
                  onClick={() => removeGroup(gi)}
                  className="ml-2 text-[10px] px-2 py-1 rounded shrink-0"
                  style={{ color: "#ef4444", background: "none", border: "1px solid rgba(239,68,68,0.2)", cursor: "pointer" }}
                >
                  remove
                </button>
              </div>

              {/* Skill chips */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                {group.skills.map((skill, si) => (
                  <span
                    key={si}
                    className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full"
                    style={{ background: "var(--card-bg)", color: "var(--text)", border: "1px solid var(--border)" }}
                  >
                    {skill}
                    <button
                      onClick={() => removeSkill(gi, si)}
                      className="text-[10px] leading-none"
                      style={{ color: "#ef4444", background: "none", border: "none", cursor: "pointer" }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              <input
                value={techInputs[gi] ?? ""}
                onChange={(e) => setTechInputs((prev) => ({ ...prev, [gi]: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSkill(gi);
                  }
                }}
                placeholder="type a skill + enter"
                className="text-xs px-2 py-1.5 rounded-lg outline-none w-full"
                style={inputStyle}
              />
            </div>
          ))}

          <button
            onClick={addGroup}
            className="text-[10px] px-3 py-1.5 rounded-lg"
            style={{ color: "var(--accent)", background: "none", border: "1px solid var(--border)", cursor: "pointer" }}
          >
            + add group
          </button>
        </div>
      </div>

      {/* Currently */}
      <div>
        <h3 className="text-xs uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)", opacity: 0.5 }}>
          currently
        </h3>

        <div className="space-y-3">
          {currentlyCategories.map((cat, ci) => (
            <div
              key={ci}
              className="p-3 rounded-lg"
              style={{ border: "1px solid var(--border)" }}
            >
              <div className="flex items-center justify-between mb-2">
                <input
                  value={cat.label}
                  onChange={(e) => updateCategory(ci, { label: e.target.value })}
                  placeholder="category (e.g. reading, learning)"
                  className="text-xs px-2 py-1.5 rounded-lg outline-none flex-1"
                  style={inputStyle}
                />
                <button
                  onClick={() => removeCategory(ci)}
                  className="ml-2 text-[10px] px-2 py-1 rounded shrink-0"
                  style={{ color: "#ef4444", background: "none", border: "1px solid rgba(239,68,68,0.2)", cursor: "pointer" }}
                >
                  remove
                </button>
              </div>

              <div className="space-y-2 ml-2">
                {cat.items.map((item, ii) => (
                  <div key={ii} className="flex items-center gap-2">
                    <input
                      value={item.name}
                      onChange={(e) => updateCategoryItem(ci, ii, { name: e.target.value })}
                      placeholder="name"
                      className="text-xs px-2 py-1.5 rounded-lg outline-none flex-1"
                      style={inputStyle}
                    />
                    <input
                      value={item.detail}
                      onChange={(e) => updateCategoryItem(ci, ii, { detail: e.target.value })}
                      placeholder="detail"
                      className="text-xs px-2 py-1.5 rounded-lg outline-none flex-1"
                      style={inputStyle}
                    />
                    <button
                      onClick={() => removeCategoryItem(ci, ii)}
                      className="text-[10px] shrink-0"
                      style={{ color: "#ef4444", background: "none", border: "none", cursor: "pointer" }}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addCategoryItem(ci)}
                  className="text-[10px]"
                  style={{ color: "var(--accent)", background: "none", border: "none", cursor: "pointer" }}
                >
                  + add item
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={addCategory}
            className="text-[10px] px-3 py-1.5 rounded-lg"
            style={{ color: "var(--accent)", background: "none", border: "1px solid var(--border)", cursor: "pointer" }}
          >
            + add category
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Completion Screen ──────────────────────────────────────────────────

function CompletionScreen({ username }: { username: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Confetti burst effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);

    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;

    const colors = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#22c55e", "#06b6d4", "#f97316"];

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      rotation: number;
      rotSpeed: number;
      life: number;
      maxLife: number;
      shape: "rect" | "circle";
    }

    const particles: Particle[] = [];

    // Create burst from center
    for (let i = 0; i < 120; i++) {
      const angle = (Math.PI * 2 * i) / 120 + (Math.random() - 0.5) * 0.5;
      const speed = 2 + Math.random() * 6;
      particles.push({
        x: W / 2,
        y: H / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        size: 3 + Math.random() * 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.2,
        life: 0,
        maxLife: 60 + Math.random() * 60,
        shape: Math.random() > 0.5 ? "rect" : "circle",
      });
    }

    let animId: number;
    function animate() {
      if (!ctx) return;
      ctx.clearRect(0, 0, W, H);

      let alive = false;
      for (const p of particles) {
        p.life++;
        if (p.life > p.maxLife) continue;
        alive = true;

        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08; // gravity
        p.vx *= 0.99;
        p.rotation += p.rotSpeed;

        const alpha = 1 - p.life / p.maxLife;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;

        if (p.shape === "rect") {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      if (alive) {
        animId = requestAnimationFrame(animate);
      }
    }

    animate();
    return () => cancelAnimationFrame(animId);
  }, []);

  const profileUrl = username ? `/${username}` : "/dashboard";

  return (
    <div className="w-full max-w-[540px] mx-auto text-center relative">
      {/* Confetti canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 10 }}
      />

      <div className="relative z-20" style={{ animation: "fadeInUp 0.6s ease-out" }}>
        {/* Success icon */}
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{
            background: "linear-gradient(135deg, var(--accent), #8b5cf6)",
            animation: "pulse 2s ease-in-out infinite",
          }}
        >
          <span className="text-2xl">🎉</span>
        </div>

        <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text)" }}>
          you&#39;re all set!
        </h2>
        <p className="text-xs mb-8" style={{ color: "var(--text-muted)" }}>
          your profile is ready to go. you can always customize it later from the dashboard.
        </p>

        <div className="flex items-center justify-center gap-3">
          <a
            href={profileUrl}
            className="text-xs font-medium px-5 py-2.5 rounded-lg transition-opacity hover:opacity-90 inline-block"
            style={{
              background: "var(--accent)",
              color: "#fff",
              boxShadow: "0 2px 8px rgba(99,102,241,0.3)",
            }}
          >
            view profile →
          </a>
          <a
            href="/dashboard"
            className="text-xs font-medium px-5 py-2.5 rounded-lg transition-opacity hover:opacity-80 inline-block"
            style={{
              background: "transparent",
              color: "var(--text-muted)",
              border: "1px solid var(--border)",
            }}
          >
            go to dashboard
          </a>
        </div>

        <p className="text-[10px] mt-6" style={{ color: "var(--text-muted)", opacity: 0.5 }}>
          redirecting to dashboard in 3 seconds...
        </p>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}

// ─── Shared Field Component ────────────────────────────────────────────

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputClass}
        style={inputStyle}
      />
    </div>
  );
}

// ─── Profile HTML Generator ────────────────────────────────────────────
// Generates a minimal tiptap-compatible profileHtml with tech-stack-block
// and currently-block data attributes, matching the existing profile
// rendering system.

function generateDefaultProfileHtml(
  groups: TechGroup[],
  categories: CurrentlyCategory[]
): string {
  const parts: string[] = [];

  if (groups.length > 0) {
    const groupsAttr = JSON.stringify(groups).replace(/"/g, "&quot;");
    parts.push(
      `<div data-type="tech-stack-block" data-groups="${groupsAttr}"></div>`
    );
  }

  if (categories.length > 0) {
    const catsAttr = JSON.stringify(categories).replace(/"/g, "&quot;");
    parts.push(
      `<div data-type="currently-block" data-categories="${catsAttr}"></div>`
    );
  }

  return parts.join("");
}
