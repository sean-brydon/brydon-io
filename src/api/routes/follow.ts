import { Hono } from "hono";
import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "@/db";
import { users, followers, notifications } from "@/db/schema";
import { authMiddleware } from "@/api/middleware";

const app = new Hono()

  // ─── Protected: Follow a user ──────────────────────────────────────
  .post("/:userId", authMiddleware, async (c) => {
    const currentUserId = c.get("userId" as never) as string;
    const targetUserId = c.req.param("userId")!;

    // Cannot follow yourself
    if (currentUserId === targetUserId) {
      return c.json({ error: "Cannot follow yourself" }, 400);
    }

    // Verify target user exists
    const targetUser = await db.query.users.findFirst({
      where: eq(users.id, targetUserId),
      columns: { id: true },
    });

    if (!targetUser) {
      return c.json({ error: "User not found" }, 404);
    }

    // Check if already following
    const existing = await db.query.followers.findFirst({
      where: and(
        eq(followers.followerId, currentUserId),
        eq(followers.followingId, targetUserId),
      ),
    });

    if (existing) {
      return c.json({ error: "Already following this user" }, 409);
    }

    // Create follow
    const [follow] = await db
      .insert(followers)
      .values({
        id: crypto.randomUUID(),
        followerId: currentUserId,
        followingId: targetUserId,
      })
      .returning();

    // Create notification for the followed user
    await db.insert(notifications).values({
      id: crypto.randomUUID(),
      userId: targetUserId,
      actorId: currentUserId,
      type: "follow",
      resourceId: null,
    });

    return c.json(follow, 201);
  })

  // ─── Protected: Unfollow a user ────────────────────────────────────
  .delete("/:userId", authMiddleware, async (c) => {
    const currentUserId = c.get("userId" as never) as string;
    const targetUserId = c.req.param("userId")!;

    const [deleted] = await db
      .delete(followers)
      .where(
        and(
          eq(followers.followerId, currentUserId),
          eq(followers.followingId, targetUserId),
        ),
      )
      .returning({ id: followers.id });

    if (!deleted) {
      return c.json({ error: "Not following this user" }, 404);
    }

    // Remove the follow notification
    await db
      .delete(notifications)
      .where(
        and(
          eq(notifications.userId, targetUserId),
          eq(notifications.actorId, currentUserId),
          eq(notifications.type, "follow"),
        ),
      );

    return c.json({ success: true });
  })

  // ─── Public: Get follow status & counts ────────────────────────────
  .get("/:userId/status", async (c) => {
    const targetUserId = c.req.param("userId")!;

    // Count followers (people who follow targetUserId)
    const [followerCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(followers)
      .where(eq(followers.followingId, targetUserId));

    // Count following (people targetUserId follows)
    const [followingCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(followers)
      .where(eq(followers.followerId, targetUserId));

    // Optionally check if the current user is following this user
    let isFollowing = false;
    try {
      const { auth } = await import("@/lib/auth");
      const session = await auth.api.getSession({
        headers: c.req.raw.headers,
      });

      if (session?.user?.id) {
        const follow = await db.query.followers.findFirst({
          where: and(
            eq(followers.followerId, session.user.id),
            eq(followers.followingId, targetUserId),
          ),
        });
        isFollowing = !!follow;
      }
    } catch {
      // Not authenticated — isFollowing stays false
    }

    return c.json({
      followers: followerCount.count,
      following: followingCount.count,
      isFollowing,
    });
  })

  // ─── Public: List followers of a user ──────────────────────────────
  .get("/:userId/followers", async (c) => {
    const targetUserId = c.req.param("userId")!;

    const result = await db.query.followers.findMany({
      where: eq(followers.followingId, targetUserId),
      orderBy: [desc(followers.createdAt)],
      with: {
        follower: {
          columns: {
            id: true,
            name: true,
            username: true,
            image: true,
            bio: true,
          },
        },
      },
    });

    return c.json(
      result.map((r) => ({
        ...r.follower,
        followedAt: r.createdAt,
      })),
    );
  })

  // ─── Public: List users a user is following ────────────────────────
  .get("/:userId/following", async (c) => {
    const targetUserId = c.req.param("userId")!;

    const result = await db.query.followers.findMany({
      where: eq(followers.followerId, targetUserId),
      orderBy: [desc(followers.createdAt)],
      with: {
        following: {
          columns: {
            id: true,
            name: true,
            username: true,
            image: true,
            bio: true,
          },
        },
      },
    });

    return c.json(
      result.map((r) => ({
        ...r.following,
        followedAt: r.createdAt,
      })),
    );
  });

export default app;
