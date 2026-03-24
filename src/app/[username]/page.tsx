import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { eq, and, desc, count } from "drizzle-orm";

import { db } from "@/db";
import { users, projects, sections, followers } from "@/db/schema";
import { auth } from "@/lib/auth";
import { Particles } from "@/components/particles";
import { GitHubContributions } from "@/components/github-contributions";
import { ProjectCard } from "@/components/project-card";
import { HobbyCategory } from "@/components/hobby-category";
import { FollowButton } from "@/components/follow-button";
import { ProfileRenderer } from "@/components/profile-renderer";

// ── Types for section configs ────────────────────────────────────────
interface HobbyItem {
  name: string;
  detail: string;
}

interface HobbyConfigCategory {
  label: string;
  items: HobbyItem[];
}

interface CurrentlyConfig {
  categories: HobbyConfigCategory[];
}

interface GitHubContributionsConfig {
  username: string;
}

// ─────────────────────────────────────────────────────────────────────

export default async function UserHomePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  // Fetch user by username
  const user = await db.query.users.findFirst({
    where: eq(users.username, username),
  });

  if (!user) {
    notFound();
  }

  // Check if current viewer is logged in
  let viewerId: string | null = null;
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    viewerId = session?.user?.id ?? null;
  } catch {}

  // Fetch projects, sections, follower count, and follow status in parallel
  const [userProjects, userSections, [followerResult], isFollowing] = await Promise.all([
    db.query.projects.findMany({
      where: eq(projects.userId, user.id),
      orderBy: [desc(projects.featured)],
    }),
    db.query.sections.findMany({
      where: and(eq(sections.userId, user.id), eq(sections.visible, true)),
      orderBy: [sections.order],
    }),
    db.select({ count: count() }).from(followers).where(eq(followers.followingId, user.id)),
    viewerId
      ? db.query.followers.findFirst({
          where: and(eq(followers.followerId, viewerId), eq(followers.followingId, user.id)),
        }).then((r) => !!r)
      : Promise.resolve(false),
  ]);

  const followerCount = followerResult?.count ?? 0;
  const isOwnProfile = viewerId === user.id;

  const displayName = user.displayUsername ?? user.name;
  const avatarUrl = user.image;

  // Extract twitter handle from the username field (e.g. "SeanBrydon13")
  const twitterHandle = user.twitterUsername;
  const githubUsername = user.githubUsername;

  return (
    <div className="max-w-[640px] mx-auto px-5 py-12">
      {/* ── Hero ──────────────────────────────────── */}
      <section className="relative mb-20">
        <div
          className="relative h-[280px] mb-8 -mx-5 overflow-hidden rounded-lg"
          style={{ background: "var(--card-bg)" }}
        >
          <Particles className="absolute inset-0" />
          {/* Badge */}
          {avatarUrl && (
            <div
              className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] pointer-events-none select-none"
              style={{
                background: "color-mix(in srgb, var(--bg) 70%, transparent)",
                backdropFilter: "blur(4px)",
                color: "var(--text-muted)",
                border: "1px solid var(--border)",
              }}
            >
              <img
                src={avatarUrl}
                alt=""
                width={16}
                height={16}
                className="rounded-full"
              />
              click to morph
            </div>
          )}
        </div>

        <h1
          className="text-2xl font-bold mb-3"
          style={{ color: "var(--text)" }}
        >
          {displayName}
        </h1>

        {user.bio && (
          <p
            className="text-sm leading-relaxed mb-4"
            style={{ color: "var(--text-muted)" }}
          >
            {user.bio}
          </p>
        )}

        {/* Follower count + follow button */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            <strong style={{ color: "var(--text)" }}>{followerCount}</strong> follower{followerCount !== 1 ? "s" : ""}
          </span>
          {viewerId && !isOwnProfile && (
            <FollowButton userId={user.id} initialFollowing={isFollowing} followerCount={followerCount} />
          )}
        </div>

        <div className="flex gap-4 text-xs">
          <Link
            href={`/${username}/work`}
            className="no-underline transition-colors"
            style={{ color: "var(--accent)" }}
          >
            work →
          </Link>
          <Link
            href={`/${username}/blog`}
            className="no-underline transition-colors"
            style={{ color: "var(--accent)" }}
          >
            blog →
          </Link>
          {githubUsername && (
            <a
              href={`https://github.com/${githubUsername}`}
              target="_blank"
              rel="noopener noreferrer"
              className="no-underline transition-colors"
              style={{ color: "var(--accent)" }}
            >
              github ↗
            </a>
          )}
          {twitterHandle && (
            <a
              href={`https://x.com/${twitterHandle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="no-underline transition-colors"
              style={{ color: "var(--accent)" }}
            >
              x ↗
            </a>
          )}
        </div>
      </section>

      {/* ── Projects ──────────────────────────────── */}
      {userProjects.length > 0 && (
        <section className="mb-20">
          <h2
            className="text-xs uppercase tracking-wider mb-6"
            style={{ color: "var(--text-muted)", opacity: 0.5 }}
          >
            projects
          </h2>

          <div className="space-y-6">
            {userProjects.map((project) => (
              <ProjectCard
                key={project.id}
                title={project.title}
                description={project.description ?? ""}
                url={project.url ?? "#"}
                tags={project.tags ?? []}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Profile Content / Dynamic Sections ─────── */}
      {user.profileHtml ? (
        <section className="mb-20">
          <ProfileRenderer content={user.profileHtml} />
        </section>
      ) : (
        userSections.map((section) => {
          if (section.type === "github_contributions") {
            const config = section.config as unknown as GitHubContributionsConfig;
            const ghUsername = config?.username ?? githubUsername;
            if (!ghUsername) return null;

            return (
              <section key={section.id} className="mb-20">
                <h2
                  className="text-xs uppercase tracking-wider mb-6"
                  style={{ color: "var(--text-muted)", opacity: 0.5 }}
                >
                  {section.title}
                </h2>
                <GitHubContributions username={ghUsername} />
              </section>
            );
          }

          if (section.type === "currently") {
            const config = section.config as unknown as CurrentlyConfig;
            const categories = config?.categories;
            if (!categories || categories.length === 0) return null;

            return (
              <section key={section.id} className="mb-12">
                <h2
                  className="text-xs uppercase tracking-wider mb-6"
                  style={{ color: "var(--text-muted)", opacity: 0.5 }}
                >
                  {section.title}
                </h2>

                <div className="grid grid-cols-2 gap-8">
                  {categories.map((category) => (
                    <HobbyCategory
                      key={category.label}
                      label={category.label}
                      items={category.items}
                    />
                  ))}
                </div>
              </section>
            );
          }

          // "contact" type is shown on the work page — skip here
          return null;
        })
      )}
    </div>
  );
}
