import type { Metadata } from "next";
import { CalSlots } from "@/components/cal-slots";

export const metadata: Metadata = {
  title: "work",
};

const experiences = [
  {
    role: "Software Engineer",
    company: "Cal.com",
    url: "https://cal.com",
    period: "2021 — present",
    description:
      "building the open-source scheduling infrastructure. working across the full stack — from api design and database migrations to frontend features used by thousands of teams daily. helped ship v2, organizations, and the platform api.",
    tags: ["next.js", "typescript", "prisma", "trpc", "react"],
  },
  {
    role: "Degree Apprentice",
    company: "Accenture",
    url: "https://accenture.com",
    period: "2018 — 2021",
    description:
      "completed a degree apprenticeship combining university study with real client work. learned the fundamentals — perl, react, css — while delivering software for enterprise clients. built a strong foundation in both engineering and professional communication.",
    tags: ["perl", "react", "css", "javascript"],
  },
];

const sideProjects = [
  {
    name: "claim the world",
    url: "https://claimtheworld.dev",
    description:
      "multiplayer world map with 720k gpu-rendered dots. real-time claiming, custom shaders, binary chunk storage. built with three.js and convex.",
  },
  {
    name: "brydon.io",
    url: "https://brydon.io",
    description:
      "this site. next.js, mdx, three.js particles, tailwind. monospaced and minimal.",
  },
];

export default function WorkPage() {
  return (
    <div className="max-w-[640px] mx-auto px-5 py-12">
      <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--text)" }}>
        work
      </h1>
      <p className="text-sm mb-12" style={{ color: "var(--text-muted)" }}>
        experience, projects, and things i've built.
      </p>

      {/* ── Experience ────────────────────────────── */}
      <section className="mb-16">
        <h2
          className="text-xs uppercase tracking-wider mb-8"
          style={{ color: "var(--text-muted)", opacity: 0.5 }}
        >
          experience
        </h2>

        <div className="space-y-0">
          {experiences.map((exp, i) => (
            <div
              key={i}
              className="relative pl-6 pb-10 last:pb-0"
              style={{ borderLeft: "1px solid var(--border)" }}
            >
              {/* Timeline dot */}
              <div
                className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full"
                style={{
                  background: i === 0 ? "var(--accent)" : "var(--border)",
                  boxShadow:
                    i === 0
                      ? "0 0 0 3px color-mix(in srgb, var(--accent) 20%, transparent)"
                      : "none",
                }}
              />

              <div className="flex items-baseline justify-between mb-1">
                <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                  {exp.role}
                  <span style={{ color: "var(--text-muted)", fontWeight: 400 }}> @ </span>
                  {exp.url ? (
                    <a
                      href={exp.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="no-underline"
                      style={{ color: "var(--accent)" }}
                    >
                      {exp.company}
                    </a>
                  ) : (
                    <span style={{ color: "var(--accent)" }}>{exp.company}</span>
                  )}
                </h3>
              </div>

              <p
                className="text-[11px] mb-3"
                style={{ color: "var(--text-muted)", opacity: 0.6 }}
              >
                {exp.period}
              </p>

              <p
                className="text-xs leading-relaxed mb-3"
                style={{ color: "var(--text-muted)" }}
              >
                {exp.description}
              </p>

              <div className="flex flex-wrap gap-1.5">
                {exp.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] px-2 py-0.5 rounded-full"
                    style={{
                      background: "var(--card-bg)",
                      color: "var(--text-muted)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Side Projects ─────────────────────────── */}
      <section className="mb-16">
        <h2
          className="text-xs uppercase tracking-wider mb-8"
          style={{ color: "var(--text-muted)", opacity: 0.5 }}
        >
          side projects
        </h2>

        <div className="space-y-6">
          {sideProjects.map((project) => (
            <a
              key={project.name}
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block no-underline group"
            >
              <h3
                className="text-sm font-semibold mb-1"
                style={{ color: "var(--text)" }}
              >
                {project.name}
                <span className="ml-1 opacity-0 group-hover:opacity-40 transition-opacity">
                  ↗
                </span>
              </h3>
              <p
                className="text-xs leading-relaxed"
                style={{ color: "var(--text-muted)" }}
              >
                {project.description}
              </p>
            </a>
          ))}
        </div>
      </section>

      {/* ── Book me ───────────────────────────────── */}
      <section>
        <h2
          className="text-xs uppercase tracking-wider mb-2"
          style={{ color: "var(--text-muted)", opacity: 0.5 }}
        >
          get in touch
        </h2>
        <p className="text-xs mb-6" style={{ color: "var(--text-muted)" }}>
          book a 30 min call — times in your timezone
        </p>
        <CalSlots />
      </section>
    </div>
  );
}
