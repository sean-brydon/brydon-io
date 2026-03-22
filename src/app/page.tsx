"use client";

import dynamic from "next/dynamic";
import Link from "next/link";

const Particles = dynamic(
  () => import("@/components/particles").then((m) => m.Particles),
  { ssr: false }
);

const GitHubContributions = dynamic(
  () => import("@/components/github-contributions").then((m) => m.GitHubContributions),
  { ssr: false }
);



export default function Home() {
  return (
    <div className="max-w-[640px] mx-auto px-5 py-12">
      {/* ── Hero ──────────────────────────────────── */}
      <section className="relative mb-20">
        <div className="relative h-[280px] mb-8 -mx-5 overflow-hidden rounded-lg" style={{ background: "var(--card-bg)" }}>
          <Particles className="absolute inset-0" />
          {/* Badge */}
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
              src="https://avatars.githubusercontent.com/u/55134778?s=40"
              alt=""
              width={16}
              height={16}
              className="rounded-full"
            />
            click to morph
          </div>
        </div>

        <h1 className="text-2xl font-bold mb-3" style={{ color: "var(--text)" }}>
          sean brydon
        </h1>
        <p className="text-sm leading-relaxed mb-6" style={{ color: "var(--text-muted)" }}>
          developer from newcastle, england. building{" "}
          <a
            href="https://cal.com"
            target="_blank"
            rel="noopener noreferrer"
            className="no-underline font-medium"
            style={{ color: "var(--accent)" }}
          >
            cal.com
          </a>
          . interested in real-time systems, gpu rendering, and building things
          people actually use.
        </p>

        <div className="flex gap-4 text-xs">
          <Link
            href="/work"
            className="no-underline transition-colors"
            style={{ color: "var(--accent)" }}
          >
            work →
          </Link>
          <Link
            href="/blog"
            className="no-underline transition-colors"
            style={{ color: "var(--accent)" }}
          >
            blog →
          </Link>
          <a
            href="https://github.com/sean-brydon"
            target="_blank"
            rel="noopener noreferrer"
            className="no-underline transition-colors"
            style={{ color: "var(--accent)" }}
          >
            github ↗
          </a>
          <a
            href="https://x.com/SeanBrydon13"
            target="_blank"
            rel="noopener noreferrer"
            className="no-underline transition-colors"
            style={{ color: "var(--accent)" }}
          >
            x ↗
          </a>
        </div>
      </section>

      {/* ── Projects ──────────────────────────────── */}
      <section className="mb-20">
        <h2
          className="text-xs uppercase tracking-wider mb-6"
          style={{ color: "var(--text-muted)", opacity: 0.5 }}
        >
          projects
        </h2>

        <div className="space-y-6">
          <ProjectCard
            title="claim the world"
            description="multiplayer world map where you can claim dots, paint your color, and write your name on countries. real-time, gpu-rendered."
            url="https://claimtheworld.dev"
            tags={["three.js", "convex", "webgl", "stripe"]}
          />
          <ProjectCard
            title="cal.com"
            description="scheduling infrastructure for everyone. open source calendly alternative. building features used by thousands of teams."
            url="https://cal.com"
            tags={["next.js", "typescript", "prisma", "trpc"]}
          />
        </div>
      </section>

      {/* ── GitHub ────────────────────────────────── */}
      <section className="mb-20">
        <h2
          className="text-xs uppercase tracking-wider mb-6"
          style={{ color: "var(--text-muted)", opacity: 0.5 }}
        >
          contributions
        </h2>
        <GitHubContributions username="sean-brydon" />
      </section>

      {/* ── Hobbies ───────────────────────────────── */}
      <section className="mb-12">
        <h2
          className="text-xs uppercase tracking-wider mb-6"
          style={{ color: "var(--text-muted)", opacity: 0.5 }}
        >
          currently
        </h2>

        <div className="grid grid-cols-2 gap-8">
          <HobbyCategory
            label="reading"
            items={[
              { name: "the way of zen", detail: "alan watts" },
              { name: "the psychology of money", detail: "morgan housel" },
            ]}
          />
          <HobbyCategory
            label="playing"
            items={[
              { name: "stardew valley", detail: "farming & vibes" },
              { name: "the finals", detail: "competitive fps" },
            ]}
          />
          <HobbyCategory
            label="shooting on"
            items={[
              { name: "sony a6700", detail: "aps-c body" },
              { name: "sony 24-50mm f/2.8 g", detail: "everyday lens" },
            ]}
          />
          <HobbyCategory
            label="watching"
            items={[
              { name: "game of thrones", detail: "rewatching" },
              { name: "pokémon", detail: "always" },
            ]}
          />
        </div>
      </section>
    </div>
  );
}

function HobbyCategory({
  label,
  items,
}: {
  label: string;
  items: { name: string; detail: string }[];
}) {
  return (
    <div>
      <span
        className="text-[11px] font-medium uppercase tracking-wider block mb-3"
        style={{ color: "var(--text-muted)", opacity: 0.5 }}
      >
        {label}
      </span>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.name}>
            <p className="text-xs font-medium" style={{ color: "var(--text)" }}>
              {item.name}
            </p>
            <p className="text-[11px]" style={{ color: "var(--text-muted)", opacity: 0.6 }}>
              {item.detail}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProjectCard({
  title,
  description,
  url,
  tags,
}: {
  title: string;
  description: string;
  url: string;
  tags: string[];
}) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block no-underline group p-4 -mx-4 rounded-lg transition-colors"
      style={{ background: "transparent" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--card-bg)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <div className="flex items-baseline justify-between mb-1.5">
        <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>
          {title}
          <span className="ml-1 opacity-0 group-hover:opacity-40 transition-opacity">↗</span>
        </h3>
      </div>
      <p className="text-xs leading-relaxed mb-3" style={{ color: "var(--text-muted)" }}>
        {description}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
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
    </a>
  );
}
