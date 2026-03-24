import { Hono } from "hono";
import { eq, and, desc } from "drizzle-orm";
import { db } from "@/db";
import { users, posts } from "@/db/schema";
import { authMiddleware } from "@/api/middleware";

const app = new Hono()

  // ─── Public: List published posts for a user ───────────────────────
  .get("/user/:username", async (c) => {
    const username = c.req.param("username");

    const user = await db.query.users.findFirst({
      where: eq(users.username, username),
      columns: { id: true },
    });

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    const userPosts = await db.query.posts.findMany({
      where: and(
        eq(posts.userId, user.id),
        eq(posts.status, "published")
      ),
      orderBy: [desc(posts.publishedAt)],
    });

    return c.json(userPosts);
  })

  // ─── Public: Get single published post by slug ─────────────────────
  .get("/user/:username/:slug", async (c) => {
    const username = c.req.param("username");
    const slug = c.req.param("slug");

    const user = await db.query.users.findFirst({
      where: eq(users.username, username),
      columns: { id: true },
    });

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    const post = await db.query.posts.findFirst({
      where: and(
        eq(posts.userId, user.id),
        eq(posts.slug, slug),
        eq(posts.status, "published")
      ),
    });

    if (!post) {
      return c.json({ error: "Post not found" }, 404);
    }

    return c.json(post);
  })

  // ─── Protected: List all posts for current user (including drafts) ─
  .get("/mine", authMiddleware, async (c) => {
    const userId = c.get("userId" as never) as string;

    const userPosts = await db.query.posts.findMany({
      where: eq(posts.userId, userId),
      orderBy: [desc(posts.updatedAt)],
    });

    return c.json(userPosts);
  })

  // ─── Protected: Create a new post ─────────────────────────────────
  .post("/", authMiddleware, async (c) => {
    const userId = c.get("userId" as never) as string;
    const body = await c.req.json();

    const { title, slug, content, description, status, coverImage, tags } = body;

    if (!title || !slug) {
      return c.json({ error: "Title and slug are required" }, 400);
    }

    // Check slug uniqueness for this user
    const existing = await db.query.posts.findFirst({
      where: and(eq(posts.userId, userId), eq(posts.slug, slug)),
      columns: { id: true },
    });

    if (existing) {
      return c.json({ error: "A post with this slug already exists" }, 409);
    }

    const postStatus = status ?? "draft";

    const [post] = await db
      .insert(posts)
      .values({
        id: crypto.randomUUID(),
        userId,
        title,
        slug,
        content: content ?? "",
        description: description ?? null,
        status: postStatus,
        coverImage: coverImage ?? null,
        tags: tags ?? [],
        publishedAt: postStatus === "published" ? new Date() : null,
      })
      .returning();

    return c.json(post, 201);
  })

  // ─── Protected: Update a post ──────────────────────────────────────
  .patch("/:id", authMiddleware, async (c) => {
    const userId = c.get("userId" as never) as string;
    const postId = c.req.param("id")!;
    const body = await c.req.json();

    // Verify ownership
    const existing = await db.query.posts.findFirst({
      where: and(eq(posts.id, postId), eq(posts.userId, userId)),
    });

    if (!existing) {
      return c.json({ error: "Post not found" }, 404);
    }

    const allowedFields = [
      "title",
      "slug",
      "content",
      "description",
      "status",
      "coverImage",
      "tags",
    ] as const;

    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    // Auto-set publishedAt when publishing for the first time
    if (updates.status === "published" && existing.status !== "published") {
      updates.publishedAt = new Date();
    }

    const [updated] = await db
      .update(posts)
      .set(updates)
      .where(and(eq(posts.id, postId), eq(posts.userId, userId)))
      .returning();

    return c.json(updated);
  })

  // ─── Protected: Delete a post ──────────────────────────────────────
  .delete("/:id", authMiddleware, async (c) => {
    const userId = c.get("userId" as never) as string;
    const postId = c.req.param("id")!;

    const [deleted] = await db
      .delete(posts)
      .where(and(eq(posts.id, postId), eq(posts.userId, userId)))
      .returning({ id: posts.id });

    if (!deleted) {
      return c.json({ error: "Post not found" }, 404);
    }

    return c.json({ success: true, id: deleted.id });
  });

export default app;
