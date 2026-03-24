import { Hono } from "hono";
import { eq, and, desc } from "drizzle-orm";
import { db } from "@/db";
import { users, workExperiences } from "@/db/schema";
import { authMiddleware } from "@/api/middleware";

const app = new Hono()

  // ─── Public: List work experiences for a user ──────────────────────
  .get("/user/:username", async (c) => {
    const username = c.req.param("username");

    const user = await db.query.users.findFirst({
      where: eq(users.username, username),
      columns: { id: true },
    });

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    const experiences = await db.query.workExperiences.findMany({
      where: eq(workExperiences.userId, user.id),
      orderBy: [desc(workExperiences.startDate)],
    });

    return c.json(experiences);
  })

  // ─── Protected: List all work experiences for current user ─────────
  .get("/mine", authMiddleware, async (c) => {
    const userId = c.get("userId" as never) as string;

    const experiences = await db.query.workExperiences.findMany({
      where: eq(workExperiences.userId, userId),
      orderBy: [desc(workExperiences.startDate)],
    });

    return c.json(experiences);
  })

  // ─── Protected: Create a work experience ───────────────────────────
  .post("/", authMiddleware, async (c) => {
    const userId = c.get("userId" as never) as string;
    const body = await c.req.json();

    const {
      company,
      role,
      description,
      startDate,
      endDate,
      companyUrl,
      companyLogo,
      location,
      type,
    } = body;

    if (!company || !role || !startDate) {
      return c.json(
        { error: "Company, role, and startDate are required" },
        400
      );
    }

    const [experience] = await db
      .insert(workExperiences)
      .values({
        id: crypto.randomUUID(),
        userId,
        company,
        role,
        description: description ?? null,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        companyUrl: companyUrl ?? null,
        companyLogo: companyLogo ?? null,
        location: location ?? null,
        type: type ?? "full-time",
      })
      .returning();

    return c.json(experience, 201);
  })

  // ─── Protected: Update a work experience ───────────────────────────
  .patch("/:id", authMiddleware, async (c) => {
    const userId = c.get("userId" as never) as string;
    const experienceId = c.req.param("id")!;
    const body = await c.req.json();

    // Verify ownership
    const existing = await db.query.workExperiences.findFirst({
      where: and(
        eq(workExperiences.id, experienceId),
        eq(workExperiences.userId, userId)
      ),
    });

    if (!existing) {
      return c.json({ error: "Work experience not found" }, 404);
    }

    const allowedFields = [
      "company",
      "role",
      "description",
      "startDate",
      "endDate",
      "companyUrl",
      "companyLogo",
      "location",
      "type",
    ] as const;

    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        // Convert date strings to Date objects
        if (field === "startDate" || field === "endDate") {
          updates[field] = body[field] ? new Date(body[field]) : null;
        } else {
          updates[field] = body[field];
        }
      }
    }

    const [updated] = await db
      .update(workExperiences)
      .set(updates)
      .where(
        and(
          eq(workExperiences.id, experienceId),
          eq(workExperiences.userId, userId)
        )
      )
      .returning();

    return c.json(updated);
  })

  // ─── Protected: Delete a work experience ───────────────────────────
  .delete("/:id", authMiddleware, async (c) => {
    const userId = c.get("userId" as never) as string;
    const experienceId = c.req.param("id")!;

    const [deleted] = await db
      .delete(workExperiences)
      .where(
        and(
          eq(workExperiences.id, experienceId),
          eq(workExperiences.userId, userId)
        )
      )
      .returning({ id: workExperiences.id });

    if (!deleted) {
      return c.json({ error: "Work experience not found" }, 404);
    }

    return c.json({ success: true, id: deleted.id });
  });

export default app;
