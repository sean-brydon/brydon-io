import { Hono } from "hono";
import { eq, count } from "drizzle-orm";
import { db } from "@/db";
import { postViews } from "@/db/schema";
import { auth } from "@/lib/auth";

const app = new Hono()

  // ─── Record a view (no auth required) ───────────────────────────
  .post("/posts/:postId", async (c) => {
    const postId = c.req.param("postId");

    // Get viewer ID if authenticated
    let userId: string | null = null;
    try {
      const session = await auth.api.getSession({ headers: c.req.raw.headers });
      userId = session?.user?.id ?? null;
    } catch {}

    // For authenticated users: upsert (unique on userId + postId)
    // For anon: always insert (userId is null, unique constraint doesn't apply)
    if (userId) {
      // Check if view exists
      const existing = await db.query.postViews.findFirst({
        where: (t, { and, eq }) => and(eq(t.postId, postId), eq(t.userId, userId!)),
      });
      if (!existing) {
        await db.insert(postViews).values({
          id: crypto.randomUUID(),
          postId,
          userId,
        });
      }
    } else {
      await db.insert(postViews).values({
        id: crypto.randomUUID(),
        postId,
        userId: null,
      });
    }

    return c.json({ recorded: true });
  })

  // ─── Get view count ─────────────────────────────────────────────
  .get("/posts/:postId", async (c) => {
    const postId = c.req.param("postId");

    const [result] = await db
      .select({ count: count() })
      .from(postViews)
      .where(eq(postViews.postId, postId));

    return c.json({ views: result?.count ?? 0 });
  });

export default app;
