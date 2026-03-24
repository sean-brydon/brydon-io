import { Hono } from "hono";
import { eq, desc, and, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { posts, users, followers } from "@/db/schema";
import { authMiddleware } from "@/api/middleware";

const app = new Hono()

  // ─── Paginated feed — posts from followed users ─────────────────
  .get("/", authMiddleware, async (c) => {
    const userId = c.get("userId" as never) as string;
    const cursor = c.req.query("cursor"); // publishedAt ISO string
    const limit = 20;

    const conditions = [
      eq(posts.status, "published"),
      sql`${posts.userId} IN (
        SELECT ${followers.followingId} FROM ${followers}
        WHERE ${followers.followerId} = ${userId}
      )`,
    ];

    if (cursor) {
      conditions.push(lt(posts.publishedAt, new Date(cursor)));
    }

    const feedPosts = await db
      .select({
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        description: posts.description,
        publishedAt: posts.publishedAt,
        tags: posts.tags,
        userId: posts.userId,
        authorName: users.name,
        authorUsername: users.username,
        authorImage: users.image,
      })
      .from(posts)
      .innerJoin(users, eq(posts.userId, users.id))
      .where(and(...conditions))
      .orderBy(desc(posts.publishedAt))
      .limit(limit + 1); // fetch one extra to check if there's more

    const hasMore = feedPosts.length > limit;
    const results = hasMore ? feedPosts.slice(0, limit) : feedPosts;
    const nextCursor = hasMore && results[results.length - 1]?.publishedAt
      ? results[results.length - 1].publishedAt!.toISOString()
      : null;

    return c.json({ posts: results, nextCursor });
  });

export default app;
