import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  users,
  sections,
  projects,
  workExperiences,
} from "@/db/schema";
import { authMiddleware } from "@/api/middleware";

const app = new Hono()

  // ─── Protected: Get current user (authenticated) ───────────────────
  // Placed before /:username so "/me" doesn't match the param route
  .get("/me", authMiddleware, async (c) => {
    const userId = c.get("userId" as never) as string;

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    return c.json(user);
  })

  // ─── Protected: Update current user's profile ──────────────────────
  .patch("/me", authMiddleware, async (c) => {
    const userId = c.get("userId" as never) as string;
    const body = await c.req.json();

    // Whitelist allowed fields
    const allowedFields = [
      "name",
      "username",
      "bio",
      "headline",
      "location",
      "websiteUrl",
      "githubUsername",
      "twitterUsername",
      "linkedinUrl",
      "image",
    ] as const;

    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return c.json({ error: "No valid fields to update" }, 400);
    }

    // If username is being changed, check uniqueness
    if (updates.username) {
      const existing = await db.query.users.findFirst({
        where: eq(users.username, updates.username as string),
        columns: { id: true },
      });
      if (existing && existing.id !== userId) {
        return c.json({ error: "Username already taken" }, 409);
      }
    }

    const [updated] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, userId))
      .returning();

    if (!updated) {
      return c.json({ error: "User not found" }, 404);
    }

    return c.json(updated);
  })

  // ─── Public: Get user profile by username ───────────────────────────
  .get("/:username", async (c) => {
    const username = c.req.param("username");

    const user = await db.query.users.findFirst({
      where: eq(users.username, username),
      columns: {
        id: true,
        name: true,
        username: true,
        image: true,
        bio: true,
        headline: true,
        location: true,
        websiteUrl: true,
        githubUsername: true,
        twitterUsername: true,
        linkedinUrl: true,
        createdAt: true,
      },
    });

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    // Fetch related data in parallel
    const [userSections, userProjects, userWork] = await Promise.all([
      db.query.sections.findMany({
        where: eq(sections.userId, user.id),
        orderBy: (t, { asc }) => [asc(t.order)],
      }),
      db.query.projects.findMany({
        where: eq(projects.userId, user.id),
        orderBy: (t, { desc }) => [desc(t.featured), desc(t.createdAt)],
      }),
      db.query.workExperiences.findMany({
        where: eq(workExperiences.userId, user.id),
        orderBy: (t, { desc }) => [desc(t.startDate)],
      }),
    ]);

    return c.json({
      ...user,
      sections: userSections,
      projects: userProjects,
      workExperiences: userWork,
    });
  });

export default app;
