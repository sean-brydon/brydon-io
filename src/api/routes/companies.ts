import { Hono } from "hono";
import { eq, and, desc } from "drizzle-orm";
import { db } from "@/db";
import { users, companies } from "@/db/schema";
import { authMiddleware } from "@/api/middleware";

const app = new Hono()

  // ─── Public: List companies for a user ─────────────────────────────
  .get("/user/:username", async (c) => {
    const username = c.req.param("username");

    const user = await db.query.users.findFirst({
      where: eq(users.username, username),
      columns: { id: true },
    });

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    const userCompanies = await db.query.companies.findMany({
      where: eq(companies.userId, user.id),
      orderBy: [desc(companies.updatedAt)],
    });

    return c.json(userCompanies);
  })

  // ─── Public: Get a company by user + slug (unambiguous) ────────────
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

    const company = await db.query.companies.findFirst({
      where: and(
        eq(companies.userId, user.id),
        eq(companies.slug, slug),
      ),
    });

    if (!company) {
      return c.json({ error: "Company not found" }, 404);
    }

    return c.json(company);
  })

  // ─── Protected: List all companies for current user ────────────────
  .get("/mine", authMiddleware, async (c) => {
    const userId = c.get("userId" as never) as string;

    const userCompanies = await db.query.companies.findMany({
      where: eq(companies.userId, userId),
      orderBy: [desc(companies.updatedAt)],
    });

    return c.json(userCompanies);
  })

  // ─── Protected: Create a new company ───────────────────────────────
  .post("/", authMiddleware, async (c) => {
    const userId = c.get("userId" as never) as string;
    const body = await c.req.json();

    const { name, slug, description, logo, website, location } = body;

    if (!name || !slug) {
      return c.json({ error: "Name and slug are required" }, 400);
    }

    // Check slug uniqueness for this user
    const existing = await db.query.companies.findFirst({
      where: and(eq(companies.userId, userId), eq(companies.slug, slug)),
      columns: { id: true },
    });

    if (existing) {
      return c.json(
        { error: "A company with this slug already exists" },
        409,
      );
    }

    const [company] = await db
      .insert(companies)
      .values({
        id: crypto.randomUUID(),
        userId,
        name,
        slug,
        description: description ?? null,
        logo: logo ?? null,
        website: website ?? null,
        location: location ?? null,
      })
      .returning();

    return c.json(company, 201);
  })

  // ─── Protected: Update a company ───────────────────────────────────
  .patch("/:id", authMiddleware, async (c) => {
    const userId = c.get("userId" as never) as string;
    const companyId = c.req.param("id")!;
    const body = await c.req.json();

    // Verify ownership
    const existing = await db.query.companies.findFirst({
      where: and(eq(companies.id, companyId), eq(companies.userId, userId)),
    });

    if (!existing) {
      return c.json({ error: "Company not found" }, 404);
    }

    const allowedFields = [
      "name",
      "slug",
      "description",
      "logo",
      "website",
      "location",
    ] as const;

    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    // If slug is changing, check uniqueness for this user
    if (updates.slug && updates.slug !== existing.slug) {
      const slugTaken = await db.query.companies.findFirst({
        where: and(
          eq(companies.userId, userId),
          eq(companies.slug, updates.slug as string),
        ),
        columns: { id: true },
      });

      if (slugTaken) {
        return c.json(
          { error: "A company with this slug already exists" },
          409,
        );
      }
    }

    const [updated] = await db
      .update(companies)
      .set(updates)
      .where(and(eq(companies.id, companyId), eq(companies.userId, userId)))
      .returning();

    return c.json(updated);
  })

  // ─── Protected: Delete a company ───────────────────────────────────
  .delete("/:id", authMiddleware, async (c) => {
    const userId = c.get("userId" as never) as string;
    const companyId = c.req.param("id")!;

    const [deleted] = await db
      .delete(companies)
      .where(and(eq(companies.id, companyId), eq(companies.userId, userId)))
      .returning({ id: companies.id });

    if (!deleted) {
      return c.json({ error: "Company not found" }, 404);
    }

    return c.json({ success: true, id: deleted.id });
  });

export default app;
