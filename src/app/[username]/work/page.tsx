import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq, desc, and } from "drizzle-orm";

import { db } from "@/db";
import { users, workExperiences, projects, sections } from "@/db/schema";
import { CalSlots } from "@/components/cal-slots";

export const metadata: Metadata = {
  title: "work",
};

interface Props {
  params: Promise<{ username: string }>;
}

// ── Helpers ──────────────────────────────────────────────────────────

/** Format DB timestamps into "YYYY — present" or "YYYY — YYYY" */
function formatPeriod(start: Date, end: Date | null): string {
  const startYear = start.getFullYear();
  return end ? `${startYear} — ${end.getFullYear()}` : `${startYear} — present`;
}

// ── Config types ─────────────────────────────────────────────────────

interface ContactConfig {
  calUsername?: string;
  description?: string;
}

// ─────────────────────────────────────────────────────────────────────

export default async function UserWorkPage({ params }: Props) {
  const { username } = await params;

  // Fetch user by username
  const user = await db.query.users.findFirst({
    where: eq(users.username, username),
  });

  if (!user) {
    notFound();
  }

  // Fetch work experiences, projects, and contact section in parallel
  const [experiences, sideProjects, contactSections] = await Promise.all([
    db.query.workExperiences.findMany({
      where: eq(workExperiences.userId, user.id),
      orderBy: [desc(workExperiences.startDate)],
    }),
    db.query.projects.findMany({
      where: eq(projects.userId, user.id),
      orderBy: [desc(projects.featured)],
    }),
    db.query.sections.findMany({
      where: and(
        eq(sections.userId, user.id),
        eq(sections.type, "contact"),
        eq(sections.visible, true),
      ),
    }),
  ]);

  // Extract calUsername from the contact section config
  const contactConfig = contactSections[0]?.config as unknown as ContactConfig | undefined;
  const calUsername = contactConfig?.calUsername;
  const contactDescription = contactConfig?.description ?? "book a 30 min call — times in your timezone";

  return (
    <div className="max-w-[640px] mx-auto px-5 py-12">
      <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--text)" }}>
        work
      </h1>
      <p className="text-sm mb-12" style={{ color: "var(--text-muted)" }}>
        experience, projects, and things i&apos;ve built.
      </p>

      {/* ── Experience ────────────────────────────── */}
      {experiences.length > 0 && (
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
                key={exp.id}
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
                      <span style={{ color: "var(--accent)" }}>{exp.company}</span>
                    )}
                  </h3>
                </div>

                <p
                  className="text-[11px] mb-3"
                  style={{ color: "var(--text-muted)", opacity: 0.6 }}
                >
                  {formatPeriod(exp.startDate, exp.endDate)}
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
            ))}
          </div>
        </section>
      )}

      {/* ── Side Projects ─────────────────────────── */}
      {sideProjects.length > 0 && (
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
                key={project.id}
                href={project.url ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="block no-underline group"
              >
                <h3
                  className="text-sm font-semibold mb-1"
                  style={{ color: "var(--text)" }}
                >
                  {project.title}
                  <span className="ml-1 opacity-0 group-hover:opacity-40 transition-opacity">
                    ↗
                  </span>
                </h3>
                {project.description && (
                  <p
                    className="text-xs leading-relaxed"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {project.description}
                  </p>
                )}
              </a>
            ))}
          </div>
        </section>
      )}

      {/* ── Book me ───────────────────────────────── */}
      {calUsername && (
        <section>
          <h2
            className="text-xs uppercase tracking-wider mb-2"
            style={{ color: "var(--text-muted)", opacity: 0.5 }}
          >
            get in touch
          </h2>
          <p className="text-xs mb-6" style={{ color: "var(--text-muted)" }}>
            {contactDescription}
          </p>
          <CalSlots calUsername={calUsername} />
        </section>
      )}
    </div>
  );
}
