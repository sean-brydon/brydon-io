import { Hono } from "hono";
import { eq, and, asc } from "drizzle-orm";
import { db } from "@/db";
import { users, sections } from "@/db/schema";
import { authMiddleware } from "@/api/middleware";

const app = new Hono()

  // ─── Public: List visible sections for a user ─────────────────────
  .get("/user/:username", async (c) => {
    const username = c.req.param("username");

    const user = await db.query.users.findFirst({
      where: eq(users.username, username),
      columns: { id: true },
    });

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    const userSections = await db.query.sections.findMany({
      where: and(
        eq(sections.userId, user.id),
        eq(sections.visible, true)
      ),
      orderBy: [asc(sections.order)],
    });

    return c.json(userSections);
  })

  // ─── Protected: List all sections for current user ─────────────────
  .get("/mine", authMiddleware, async (c) => {
    const userId = c.get("userId" as never) as string;

    const userSections = await db.query.sections.findMany({
      where: eq(sections.userId, userId),
      orderBy: [asc(sections.order)],
    });

    return c.json(userSections);
  })

  // ─── Protected: Create a section ───────────────────────────────────
  .post("/", authMiddleware, async (c) => {
    const userId = c.get("userId" as never) as string;
    const body = await c.req.json();

    const { type, title, content, order, visible, config } = body;

    if (!type || !title) {
      return c.json({ error: "Type and title are required" }, 400);
    }

    // Auto-calculate order if not provided
    let sectionOrder = order;
    if (sectionOrder === undefined) {
      const existingSections = await db.query.sections.findMany({
        where: eq(sections.userId, userId),
        columns: { order: true },
      });
      sectionOrder =
        existingSections.length > 0
          ? Math.max(...existingSections.map((s) => s.order)) + 1
          : 0;
    }

    const [section] = await db
      .insert(sections)
      .values({
        id: crypto.randomUUID(),
        userId,
        type,
        title,
        content: content ?? null,
        order: sectionOrder,
        visible: visible ?? true,
        config: config ?? {},
      })
      .returning();

    return c.json(section, 201);
  })

  // ─── Protected: Update a section ───────────────────────────────────
  .patch("/:id", authMiddleware, async (c) => {
    const userId = c.get("userId" as never) as string;
    const sectionId = c.req.param("id")!;
    const body = await c.req.json();

    // Verify ownership
    const existing = await db.query.sections.findFirst({
      where: and(eq(sections.id, sectionId), eq(sections.userId, userId)),
    });

    if (!existing) {
      return c.json({ error: "Section not found" }, 404);
    }

    const allowedFields = [
      "type",
      "title",
      "content",
      "order",
      "visible",
      "config",
    ] as const;

    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    const [updated] = await db
      .update(sections)
      .set(updates)
      .where(and(eq(sections.id, sectionId), eq(sections.userId, userId)))
      .returning();

    return c.json(updated);
  })

  // ─── Protected: Reorder sections ───────────────────────────────────
  .put("/reorder", authMiddleware, async (c) => {
    const userId = c.get("userId" as never) as string;
    const body = await c.req.json();

    const { orderedIds } = body as { orderedIds: string[] };

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return c.json({ error: "orderedIds array is required" }, 400);
    }

    // Update each section's order
    const results = await Promise.all(
      orderedIds.map((id, index) =>
        db
          .update(sections)
          .set({ order: index })
          .where(and(eq(sections.id, id), eq(sections.userId, userId)))
          .returning({ id: sections.id })
      )
    );

    const updatedCount = results.filter((r) => r.length > 0).length;

    return c.json({ success: true, updatedCount });
  })

  // ─── Protected: Delete a section ───────────────────────────────────
  .delete("/:id", authMiddleware, async (c) => {
    const userId = c.get("userId" as never) as string;
    const sectionId = c.req.param("id")!;

    const [deleted] = await db
      .delete(sections)
      .where(and(eq(sections.id, sectionId), eq(sections.userId, userId)))
      .returning({ id: sections.id });

    if (!deleted) {
      return c.json({ error: "Section not found" }, 404);
    }

    return c.json({ success: true, id: deleted.id });
  });

export default app;
