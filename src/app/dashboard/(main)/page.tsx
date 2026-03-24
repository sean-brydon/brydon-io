import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { eq, count } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { posts, projects, workExperiences, sections, users } from "@/db/schema";

export const metadata: Metadata = {
  title: "dashboard",
};

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session!.user.id;

  // Fetch all counts + username in parallel
  const [postResult, projectResult, experienceResult, sectionResult, user] = await Promise.all([
    db.select({ count: count() }).from(posts).where(eq(posts.userId, userId)),
    db.select({ count: count() }).from(projects).where(eq(projects.userId, userId)),
    db.select({ count: count() }).from(workExperiences).where(eq(workExperiences.userId, userId)),
    db.select({ count: count() }).from(sections).where(eq(sections.userId, userId)),
    db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { username: true },
    }),
  ]);

  const postCount = postResult[0]?.count ?? 0;
  const projectCount = projectResult[0]?.count ?? 0;
  const experienceCount = experienceResult[0]?.count ?? 0;
  const sectionCount = sectionResult[0]?.count ?? 0;
  const username = user?.username;

  const cards = [
    {
      title: "posts",
      description: "write and manage blog posts",
      href: "/dashboard/posts",
      count: postCount,
    },
    {
      title: "projects",
      description: "showcase your work",
      href: "/dashboard/projects",
      count: projectCount,
    },
    {
      title: "experience",
      description: "manage your work history",
      href: "/dashboard/experience",
      count: experienceCount,
    },
    {
      title: "profile",
      description: "edit your profile page",
      href: "/dashboard/profile",
      count: sectionCount,
    },
  ];

  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>
          dashboard
        </h1>
        {username && (
          <Link
            href={`/${username}`}
            className="text-xs hover:underline"
            style={{ color: "var(--text-muted)" }}
          >
            view profile →
          </Link>
        )}
      </div>
      <p className="text-xs mb-8" style={{ color: "var(--text-muted)" }}>
        manage your portfolio content
      </p>

      <div className="grid grid-cols-2 gap-4">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="block no-underline p-4 rounded-lg transition-colors hover:opacity-80"
            style={{
              background: "var(--card-bg)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="flex items-baseline justify-between mb-1">
              <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                {card.title}
              </h3>
              <span className="text-xs" style={{ color: "var(--text-muted)", opacity: 0.5 }}>
                {card.count}
              </span>
            </div>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {card.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
