/**
 * Seed script — populates the database with Sean's existing portfolio data.
 * Run: pnpm db:seed
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schemas";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, username } from "better-auth/plugins";
import * as fs from "fs";
import * as path from "path";

// ── Create DB + Auth inline (no @/ imports to avoid hoisting issues) ──
const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
    usePlural: true,
  }),
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET || "seed-script-secret",
  emailAndPassword: { enabled: true },
  plugins: [
    admin(),
    username({ minUsernameLength: 3, maxUsernameLength: 30 }),
  ],
});

// ── Helpers ──────────────────────────────────────────────────────────
function id() {
  return crypto.randomUUID();
}

function parseFrontmatter(content: string) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: {} as Record<string, string>, body: content };

  const meta: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const [key, ...rest] = line.split(":");
    if (key && rest.length) {
      meta[key.trim()] = rest.join(":").trim().replace(/^['"]|['"]$/g, "");
    }
  }
  return { meta, body: match[2] };
}

const SEED_PASSWORD = process.env.SEED_PASSWORD || "devl-dev-2024!";

// ── Main ─────────────────────────────────────────────────────────────
async function seed() {
  console.log("🌱 Seeding database...\n");

  // 1. Create user via better-auth admin API
  const response = await auth.api.createUser({
    body: {
      email: "sean@brydon.io",
      password: SEED_PASSWORD,
      name: "sean brydon",
      role: "admin",
      data: {
        username: "sean",
        bio: "developer from newcastle, england. building cal.com. interested in real-time systems, gpu rendering, and building things people actually use.",
        headline: "software engineer @ cal.com",
        location: "newcastle, england",
        githubUsername: "sean-brydon",
        twitterUsername: "SeanBrydon13",
        websiteUrl: "https://brydon.io",
        image: "https://avatars.githubusercontent.com/u/55134778?s=400",
      },
    },
  });

  const userId = (response as any).user?.id ?? (response as any).id;
  if (!userId) {
    console.error("Failed to create user:", response);
    process.exit(1);
  }
  console.log(`✓ User: sean (${userId})`);
  console.log(`  email: sean@brydon.io`);
  console.log(`  password: ${SEED_PASSWORD}`);

  // 2. Blog posts from content/blog/
  const blogDir = path.join(process.cwd(), "content/blog");
  if (fs.existsSync(blogDir)) {
    const files = fs.readdirSync(blogDir).filter((f) => f.endsWith(".mdx"));
    for (const file of files) {
      const raw = fs.readFileSync(path.join(blogDir, file), "utf-8");
      const { meta, body } = parseFrontmatter(raw);
      const slug = file.replace(/\.mdx$/, "");

      await db.insert(schema.posts).values({
        id: id(),
        userId,
        slug,
        title: meta.title || slug,
        description: meta.description || null,
        content: body,
        status: "published",
        tags: meta.tags ? JSON.parse(meta.tags) : [],
        publishedAt: meta.date ? new Date(meta.date) : new Date(),
      });
      console.log(`✓ Post: ${slug}`);
    }
  }

  // 3. Projects
  await db.insert(schema.projects).values([
    {
      id: id(),
      userId,
      title: "claim the world",
      description: "multiplayer world map where you can claim dots, paint your color, and write your name on countries. real-time, gpu-rendered.",
      url: "https://claimtheworld.dev",
      tags: ["three.js", "convex", "webgl", "stripe"],
      featured: true,
    },
    {
      id: id(),
      userId,
      title: "cal.com",
      description: "scheduling infrastructure for everyone. open source calendly alternative. building features used by thousands of teams.",
      url: "https://cal.com",
      repoUrl: "https://github.com/calcom/cal.com",
      tags: ["next.js", "typescript", "prisma", "trpc"],
      featured: true,
    },
  ]);
  console.log("✓ Projects: 2");

  // 4. Work experiences
  await db.insert(schema.workExperiences).values([
    {
      id: id(),
      userId,
      company: "Cal.com",
      role: "Software Engineer",
      description: "building the open-source scheduling infrastructure. working across the full stack — from api design and database migrations to frontend features used by thousands of teams daily.",
      companyUrl: "https://cal.com",
      startDate: new Date("2021-01-01"),
      endDate: null,
      type: "full-time",
      location: "remote",
    },
    {
      id: id(),
      userId,
      company: "Accenture",
      role: "Degree Apprentice",
      description: "completed a degree apprenticeship combining university study with real client work. learned the fundamentals — perl, react, css — while delivering software for enterprise clients.",
      companyUrl: "https://accenture.com",
      startDate: new Date("2018-01-01"),
      endDate: new Date("2021-01-01"),
      type: "full-time",
      location: "newcastle, england",
    },
  ]);
  console.log("✓ Work experiences: 2");

  // 5. Profile sections
  await db.insert(schema.sections).values([
    {
      id: id(), userId, type: "currently", title: "currently", order: 0, visible: true,
      config: {
        categories: [
          { label: "reading", items: [{ name: "the way of zen", detail: "alan watts" }, { name: "the psychology of money", detail: "morgan housel" }] },
          { label: "playing", items: [{ name: "stardew valley", detail: "farming & vibes" }, { name: "the finals", detail: "competitive fps" }] },
          { label: "shooting on", items: [{ name: "sony a6700", detail: "aps-c body" }, { name: "sony 24-50mm f/2.8 g", detail: "everyday lens" }] },
          { label: "watching", items: [{ name: "game of thrones", detail: "rewatching" }, { name: "pokémon", detail: "always" }] },
        ],
      },
    },
    { id: id(), userId, type: "github_contributions", title: "contributions", order: 1, visible: true, config: { username: "sean-brydon" } },
    { id: id(), userId, type: "contact", title: "get in touch", order: 2, visible: true, config: { calUsername: "sean-brydon", description: "book a 30 min call — times in your timezone" } },
  ]);
  console.log("✓ Sections: 3");

  console.log("\n✅ Seed complete!");
  await client.end();
}

seed().catch(async (err) => {
  console.error("❌ Seed failed:", err);
  await client.end();
  process.exit(1);
});
