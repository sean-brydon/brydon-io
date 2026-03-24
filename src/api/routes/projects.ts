import { Hono } from "hono";
import { eq, and, desc } from "drizzle-orm";
import { db } from "@/db";
import { users, projects } from "@/db/schema";
import { authMiddleware } from "@/api/middleware";

const app = new Hono()

  // ─── Public: List projects for a user ──────────────────────────────
  .get("/user/:username", async (c) => {
    const username = c.req.param("username");

    const user = await db.query.users.findFirst({
      where: eq(users.username, username),
      columns: { id: true },
    });

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    const userProjects = await db.query.projects.findMany({
      where: eq(projects.userId, user.id),
      orderBy: [desc(projects.featured), desc(projects.createdAt)],
    });

    return c.json(userProjects);
  })

  // ─── Protected: List all projects for current user ─────────────────
  .get("/mine", authMiddleware, async (c) => {
    const userId = c.get("userId" as never) as string;

    const userProjects = await db.query.projects.findMany({
      where: eq(projects.userId, userId),
      orderBy: [desc(projects.featured), desc(projects.createdAt)],
    });

    return c.json(userProjects);
  })

  // ─── Protected: Create a project ───────────────────────────────────
  .post("/", authMiddleware, async (c) => {
    const userId = c.get("userId" as never) as string;
    const body = await c.req.json();

    const { title, description, url, repoUrl, coverImage, tags, featured, status } =
      body;

    if (!title) {
      return c.json({ error: "Title is required" }, 400);
    }

    const [project] = await db
      .insert(projects)
      .values({
        id: crypto.randomUUID(),
        userId,
        title,
        description: description ?? null,
        url: url ?? null,
        repoUrl: repoUrl ?? null,
        coverImage: coverImage ?? null,
        tags: tags ?? [],
        featured: featured ?? false,
        status: status ?? "active",
      })
      .returning();

    return c.json(project, 201);
  })

  // ─── Protected: Update a project ───────────────────────────────────
  .patch("/:id", authMiddleware, async (c) => {
    const userId = c.get("userId" as never) as string;
    const projectId = c.req.param("id")!;
    const body = await c.req.json();

    // Verify ownership
    const existing = await db.query.projects.findFirst({
      where: and(eq(projects.id, projectId), eq(projects.userId, userId)),
    });

    if (!existing) {
      return c.json({ error: "Project not found" }, 404);
    }

    const allowedFields = [
      "title",
      "description",
      "url",
      "repoUrl",
      "coverImage",
      "tags",
      "featured",
      "status",
    ] as const;

    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    const [updated] = await db
      .update(projects)
      .set(updates)
      .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
      .returning();

    return c.json(updated);
  })

  // ─── Protected: Delete a project ───────────────────────────────────
  .delete("/:id", authMiddleware, async (c) => {
    const userId = c.get("userId" as never) as string;
    const projectId = c.req.param("id")!;

    const [deleted] = await db
      .delete(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
      .returning({ id: projects.id });

    if (!deleted) {
      return c.json({ error: "Project not found" }, 404);
    }

    return c.json({ success: true, id: deleted.id });
  });

export default app;
