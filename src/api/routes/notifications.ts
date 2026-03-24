import { Hono } from "hono";
import { eq, desc, and, inArray, count } from "drizzle-orm";
import { db } from "@/db";
import { notifications, users } from "@/db/schema";
import { authMiddleware } from "@/api/middleware";

const app = new Hono()

  // ─── List notifications ─────────────────────────────────────────
  .get("/", authMiddleware, async (c) => {
    const userId = c.get("userId" as never) as string;
    const limit = parseInt(c.req.query("limit") ?? "20");
    const offset = parseInt(c.req.query("offset") ?? "0");

    const [items, [unread]] = await Promise.all([
      db
        .select({
          id: notifications.id,
          type: notifications.type,
          resourceId: notifications.resourceId,
          read: notifications.read,
          createdAt: notifications.createdAt,
          actorId: notifications.actorId,
          actorName: users.name,
          actorUsername: users.username,
          actorImage: users.image,
        })
        .from(notifications)
        .leftJoin(users, eq(notifications.actorId, users.id))
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt))
        .limit(limit)
        .offset(offset),

      db
        .select({ count: count() })
        .from(notifications)
        .where(and(eq(notifications.userId, userId), eq(notifications.read, false))),
    ]);

    return c.json({
      notifications: items,
      unreadCount: unread?.count ?? 0,
    });
  })

  // ─── Mark as read ───────────────────────────────────────────────
  .post("/read", authMiddleware, async (c) => {
    const userId = c.get("userId" as never) as string;
    const body = await c.req.json();

    if (body.all) {
      await db
        .update(notifications)
        .set({ read: true })
        .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
    } else if (body.ids && Array.isArray(body.ids)) {
      await db
        .update(notifications)
        .set({ read: true })
        .where(and(
          eq(notifications.userId, userId),
          inArray(notifications.id, body.ids),
        ));
    }

    return c.json({ success: true });
  });

export default app;
