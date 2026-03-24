import { Hono } from "hono";
import { eq, and, desc, isNull, sql, inArray } from "drizzle-orm";
import { db } from "@/db";
import { comments, posts, notifications } from "@/db/schema";
import { authMiddleware } from "@/api/middleware";

const MAX_COMMENT_LENGTH = 10_000;

const app = new Hono()

  // ─── Public: Get comments for a post (nested, max 1 level) ────────
  .get("/posts/:postId", async (c) => {
    const postId = c.req.param("postId")!;

    // Verify post exists
    const post = await db.query.posts.findFirst({
      where: eq(posts.id, postId),
      columns: { id: true },
    });

    if (!post) {
      return c.json({ error: "Post not found" }, 404);
    }

    // Fetch top-level comments with their replies and user info
    const topLevelComments = await db.query.comments.findMany({
      where: and(
        eq(comments.postId, postId),
        isNull(comments.parentId),
      ),
      orderBy: [desc(comments.createdAt)],
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
        replies: {
          orderBy: [desc(comments.createdAt)],
          with: {
            user: {
              columns: {
                id: true,
                name: true,
                username: true,
                image: true,
              },
            },
          },
        },
      },
    });

    // Also return total comment count (top-level + replies)
    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(comments)
      .where(eq(comments.postId, postId));

    return c.json({
      comments: topLevelComments,
      total: countResult.count,
    });
  })

  // ─── Protected: Create a comment on a post ────────────────────────
  .post("/posts/:postId", authMiddleware, async (c) => {
    const userId = c.get("userId" as never) as string;
    const postId = c.req.param("postId")!;
    const body = await c.req.json();

    const { content, parentId } = body as {
      content: string;
      parentId?: string;
    };

    if (!content || !content.trim()) {
      return c.json({ error: "Content is required" }, 400);
    }

    if (content.length > MAX_COMMENT_LENGTH) {
      return c.json(
        { error: `Comment must be ${MAX_COMMENT_LENGTH.toLocaleString()} characters or fewer` },
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

    // If this is a reply, verify parent comment exists and belongs to the same post
    // Enforce max 1 level of nesting: replies cannot have replies
    let resolvedParentId: string | null = null;

    if (parentId) {
      const parentComment = await db.query.comments.findFirst({
        where: and(
          eq(comments.id, parentId),
          eq(comments.postId, postId),
        ),
        columns: { id: true, parentId: true, userId: true },
      });

      if (!parentComment) {
        return c.json(
          { error: "Parent comment not found or belongs to a different post" },
          404,
        );
      }

      // If the parent is already a reply, nest under the root parent instead
      // This enforces max 1 level of nesting
      resolvedParentId = parentComment.parentId ?? parentComment.id;
    }

    // Create the comment
    const [comment] = await db
      .insert(comments)
      .values({
        id: crypto.randomUUID(),
        userId,
        postId,
        parentId: resolvedParentId,
        content: content.trim(),
      })
      .returning();

    // Fetch the comment with user info for the response
    const commentWithUser = await db.query.comments.findFirst({
      where: eq(comments.id, comment.id),
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
    });

    // ─── Create notifications ────────────────────────────────────────
    const notifiedUserIds = new Set<string>();

    // If this is a reply, notify the parent comment author first
    if (resolvedParentId) {
      const parentComment = await db.query.comments.findFirst({
        where: eq(comments.id, resolvedParentId),
        columns: { userId: true },
      });

      if (parentComment && parentComment.userId !== userId) {
        await db.insert(notifications).values({
          id: crypto.randomUUID(),
          userId: parentComment.userId,
          actorId: userId,
          type: "reply",
          resourceId: comment.id,
        });
        notifiedUserIds.add(parentComment.userId);
      }
    }

    // Notify the post author about the comment (if not self and not already notified as reply)
    if (post.userId !== userId && !notifiedUserIds.has(post.userId)) {
      await db.insert(notifications).values({
        id: crypto.randomUUID(),
        userId: post.userId,
        actorId: userId,
        type: "comment",
        resourceId: postId,
      });
    }

    return c.json(commentWithUser, 201);
  })

  // ─── Protected: Update a comment ──────────────────────────────────
  .patch("/:commentId", authMiddleware, async (c) => {
    const userId = c.get("userId" as never) as string;
    const commentId = c.req.param("commentId")!;
    const body = await c.req.json();

    const { content } = body as { content: string };

    if (!content || !content.trim()) {
      return c.json({ error: "Content is required" }, 400);
    }

    if (content.length > MAX_COMMENT_LENGTH) {
      return c.json(
        { error: `Comment must be ${MAX_COMMENT_LENGTH.toLocaleString()} characters or fewer` },
        400,
      );
    }

    // Verify ownership
    const existing = await db.query.comments.findFirst({
      where: and(
        eq(comments.id, commentId),
        eq(comments.userId, userId),
      ),
    });

    if (!existing) {
      return c.json({ error: "Comment not found" }, 404);
    }

    const [updated] = await db
      .update(comments)
      .set({ content: content.trim() })
      .where(
        and(eq(comments.id, commentId), eq(comments.userId, userId)),
      )
      .returning();

    // Fetch with user info
    const commentWithUser = await db.query.comments.findFirst({
      where: eq(comments.id, updated.id),
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
    });

    return c.json(commentWithUser);
  })

  // ─── Protected: Delete a comment ──────────────────────────────────
  .delete("/:commentId", authMiddleware, async (c) => {
    const userId = c.get("userId" as never) as string;
    const commentId = c.req.param("commentId")!;

    // Verify ownership
    const existing = await db.query.comments.findFirst({
      where: and(
        eq(comments.id, commentId),
        eq(comments.userId, userId),
      ),
      columns: { id: true, postId: true, parentId: true },
    });

    if (!existing) {
      return c.json({ error: "Comment not found" }, 404);
    }

    // Collect all IDs whose notifications need cleanup (the comment itself + any replies)
    const idsToCleanup: string[] = [commentId];

    // If this is a top-level comment, collect reply IDs before deletion
    if (!existing.parentId) {
      const replies = await db
        .select({ id: comments.id })
        .from(comments)
        .where(eq(comments.parentId, commentId));

      const replyIds = replies.map((r) => r.id);
      idsToCleanup.push(...replyIds);

      // Delete all replies
      if (replyIds.length > 0) {
        await db
          .delete(comments)
          .where(inArray(comments.id, replyIds));
      }
    }

    // Delete the comment itself
    const [deleted] = await db
      .delete(comments)
      .where(
        and(eq(comments.id, commentId), eq(comments.userId, userId)),
      )
      .returning({ id: comments.id });

    if (!deleted) {
      return c.json({ error: "Comment not found" }, 404);
    }

    // Clean up notifications for the deleted comment and all its replies
    await db
      .delete(notifications)
      .where(inArray(notifications.resourceId, idsToCleanup));

    return c.json({ success: true, id: deleted.id });
  });

export default app;
