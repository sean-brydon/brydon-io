import { Hono } from "hono";
import { eq, and, sql } from "drizzle-orm";
import { db } from "@/db";
import { reactions, posts, notifications } from "@/db/schema";
import { authMiddleware } from "@/api/middleware";

const VALID_REACTION_TYPES = [
  "like",
  "love",
  "fire",
  "clap",
  "insightful",
] as const;

type ReactionType = (typeof VALID_REACTION_TYPES)[number];

const app = new Hono()

  // ─── Public: Get reaction counts + current user's reactions ────────
  .get("/posts/:postId", async (c) => {
    const postId = c.req.param("postId")!;

    // Get counts grouped by type
    const counts = await db
      .select({
        type: reactions.type,
        count: sql<number>`count(*)::int`,
      })
      .from(reactions)
      .where(eq(reactions.postId, postId))
      .groupBy(reactions.type);

    // Build a map of type → count
    const countMap: Record<string, number> = {};
    for (const row of counts) {
      countMap[row.type] = row.count;
    }

    // Optionally get the current user's reactions
    let userReactions: string[] = [];
    try {
      const { auth } = await import("@/lib/auth");
      const session = await auth.api.getSession({
        headers: c.req.raw.headers,
      });

      if (session?.user?.id) {
        const userRows = await db
          .select({ type: reactions.type })
          .from(reactions)
          .where(
            and(
              eq(reactions.postId, postId),
              eq(reactions.userId, session.user.id),
            ),
          );
        userReactions = userRows.map((r) => r.type);
      }
    } catch {
      // Not authenticated — userReactions stays empty
    }

    return c.json({
      counts: countMap,
      userReactions,
    });
  })

  // ─── Protected: Toggle a reaction on a post ───────────────────────
  .post("/posts/:postId", authMiddleware, async (c) => {
    const userId = c.get("userId" as never) as string;
    const postId = c.req.param("postId")!;
    const body = await c.req.json();

    const { type } = body as { type: string };

    // Validate reaction type
    if (!type || !VALID_REACTION_TYPES.includes(type as ReactionType)) {
      return c.json(
        {
          error: `Invalid reaction type. Must be one of: ${VALID_REACTION_TYPES.join(", ")}`,
        },
        400,
      );
    }

    // Verify post exists and get its author
    const post = await db.query.posts.findFirst({
      where: eq(posts.id, postId),
      columns: { id: true, userId: true },
    });

    if (!post) {
      return c.json({ error: "Post not found" }, 404);
    }

    // Check if reaction already exists (toggle behavior)
    const existing = await db.query.reactions.findFirst({
      where: and(
        eq(reactions.postId, postId),
        eq(reactions.userId, userId),
        eq(reactions.type, type),
      ),
    });

    if (existing) {
      // Remove the reaction
      await db
        .delete(reactions)
        .where(
          and(
            eq(reactions.postId, postId),
            eq(reactions.userId, userId),
            eq(reactions.type, type),
          ),
        );

      // Clean up the notification
      await db
        .delete(notifications)
        .where(
          and(
            eq(notifications.userId, post.userId),
            eq(notifications.actorId, userId),
            eq(notifications.type, "reaction"),
            eq(notifications.resourceId, postId),
          ),
        );

      return c.json({ action: "removed", type });
    }

    // Create the reaction
    const [reaction] = await db
      .insert(reactions)
      .values({
        id: crypto.randomUUID(),
        userId,
        postId,
        type,
      })
      .returning();

    // Create notification for post author (if not self)
    if (post.userId !== userId) {
      await db.insert(notifications).values({
        id: crypto.randomUUID(),
        userId: post.userId,
        actorId: userId,
        type: "reaction",
        resourceId: postId,
      });
    }

    return c.json({ action: "added", type, reaction }, 201);
  });

export default app;
