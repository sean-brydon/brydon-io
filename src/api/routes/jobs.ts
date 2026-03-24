import { Hono } from "hono";
import { eq, and, desc, ilike, sql, count } from "drizzle-orm";
import { db } from "@/db";
import { jobs, companies, applications, savedJobs } from "@/db/schema";
import { authMiddleware } from "@/api/middleware";

const app = new Hono()

  // ─── Public: List published jobs (with optional filters) ───────────
  .get("/", async (c) => {
    const query = c.req.query();
    const {
      search,
      location,
      type,
      remote,
      experience,
      tag,
      companyId,
      limit: limitStr,
      offset: offsetStr,
    } = query;

    const limit = Math.min(parseInt(limitStr || "20", 10), 100);
    const offset = parseInt(offsetStr || "0", 10);

    const conditions = [eq(jobs.status, "published")];

    if (search) {
      conditions.push(ilike(jobs.title, `%${search}%`));
    }
    if (location) {
      conditions.push(ilike(jobs.location, `%${location}%`));
    }
    if (type) {
      conditions.push(eq(jobs.employmentType, type));
    }
    if (remote) {
      conditions.push(eq(jobs.remotePolicy, remote));
    }
    if (experience) {
      conditions.push(eq(jobs.experienceLevel, experience));
    }
    if (companyId) {
      conditions.push(eq(jobs.companyId, companyId));
    }

    const where = and(...conditions);

    let results;

    if (tag) {
      // Tag filtering requires a SQL expression since tags is jsonb
      results = await db.query.jobs.findMany({
        where: and(where, sql`${jobs.tags} @> ${JSON.stringify([tag])}::jsonb`),
        with: { company: true },
        orderBy: [desc(jobs.publishedAt), desc(jobs.createdAt)],
        limit,
        offset,
      });
    } else {
      results = await db.query.jobs.findMany({
        where,
        with: { company: true },
        orderBy: [desc(jobs.publishedAt), desc(jobs.createdAt)],
        limit,
        offset,
      });
    }

    return c.json(results);
  })

  // ─── Protected: List saved jobs for current user ───────────────────
  .get("/saved", authMiddleware, async (c) => {
    const userId = c.get("userId" as never) as string;

    const saved = await db.query.savedJobs.findMany({
      where: eq(savedJobs.userId, userId),
      with: {
        job: {
          with: { company: true },
        },
      },
      orderBy: [desc(savedJobs.createdAt)],
    });

    return c.json(saved);
  })

  // ─── Protected: List jobs owned by current user (dashboard) ────────
  .get("/mine", authMiddleware, async (c) => {
    const userId = c.get("userId" as never) as string;

    const userJobs = await db.query.jobs.findMany({
      where: eq(jobs.userId, userId),
      with: { company: true },
      orderBy: [desc(jobs.updatedAt)],
    });

    return c.json(userJobs);
  })

  // ─── Public: Get a single job by ID ────────────────────────────────
  .get("/:id", async (c) => {
    const jobId = c.req.param("id");

    const job = await db.query.jobs.findFirst({
      where: eq(jobs.id, jobId),
      with: {
        company: true,
        applications: {
          columns: { id: true },
        },
      },
    });

    if (!job) {
      return c.json({ error: "Job not found" }, 404);
    }

    // Include application count but not the full applications list publicly
    const { applications: apps, ...rest } = job;
    const result = {
      ...rest,
      applicationCount: apps.length,
    };

    return c.json(result);
  })

  // ─── Protected: Create a new job (with plan enforcement) ───────────
  .post("/", authMiddleware, async (c) => {
    const userId = c.get("userId" as never) as string;
    const body = await c.req.json();

    const {
      companyId,
      slug,
      title,
      description,
      location,
      employmentType,
      salaryMin,
      salaryMax,
      salaryCurrency,
      remotePolicy,
      experienceLevel,
      applyUrl,
      tags,
      status,
    } = body;

    if (!companyId || !slug || !title) {
      return c.json(
        { error: "companyId, slug, and title are required" },
        400,
      );
    }

    // Verify company ownership
    const company = await db.query.companies.findFirst({
      where: and(eq(companies.id, companyId), eq(companies.userId, userId)),
    });

    if (!company) {
      return c.json({ error: "Company not found" }, 404);
    }

    // Plan enforcement: check how many published jobs the company has
    // free = 0 published jobs, starter = 3, business/enterprise = unlimited
    const wantsPublished = status === "published";
    if (wantsPublished) {
      const plan = company.plan ?? "free";

      if (plan === "free") {
        return c.json(
          { error: "Free plan does not allow publishing jobs. Please upgrade." },
          403,
        );
      }

      if (plan === "starter") {
        const [publishedCount] = await db
          .select({ count: count() })
          .from(jobs)
          .where(
            and(eq(jobs.companyId, companyId), eq(jobs.status, "published")),
          );

        if (publishedCount.count >= 3) {
          return c.json(
            {
              error:
                "Starter plan allows a maximum of 3 published jobs. Please upgrade.",
            },
            403,
          );
        }
      }
      // business & enterprise: unlimited
    }

    // Check slug uniqueness for this company
    const existingSlug = await db.query.jobs.findFirst({
      where: and(eq(jobs.companyId, companyId), eq(jobs.slug, slug)),
      columns: { id: true },
    });

    if (existingSlug) {
      return c.json(
        { error: "A job with this slug already exists for this company" },
        409,
      );
    }

    const [job] = await db
      .insert(jobs)
      .values({
        id: crypto.randomUUID(),
        userId,
        companyId,
        slug,
        title,
        description: description ?? null,
        location: location ?? null,
        employmentType: employmentType ?? "full-time",
        salaryMin: salaryMin ?? null,
        salaryMax: salaryMax ?? null,
        salaryCurrency: salaryCurrency ?? "USD",
        remotePolicy: remotePolicy ?? "remote",
        experienceLevel: experienceLevel ?? null,
        applyUrl: applyUrl ?? null,
        tags: tags ?? [],
        status: status ?? "draft",
        publishedAt: wantsPublished ? new Date() : null,
      })
      .returning();

    return c.json(job, 201);
  })

  // ─── Protected: Update a job ───────────────────────────────────────
  .patch("/:id", authMiddleware, async (c) => {
    const userId = c.get("userId" as never) as string;
    const jobId = c.req.param("id")!;
    const body = await c.req.json();

    // Verify ownership
    const existing = await db.query.jobs.findFirst({
      where: and(eq(jobs.id, jobId), eq(jobs.userId, userId)),
    });

    if (!existing) {
      return c.json({ error: "Job not found" }, 404);
    }

    const allowedFields = [
      "slug",
      "title",
      "description",
      "location",
      "employmentType",
      "salaryMin",
      "salaryMax",
      "salaryCurrency",
      "remotePolicy",
      "experienceLevel",
      "applyUrl",
      "tags",
      "status",
    ] as const;

    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    // If slug is changing, check uniqueness for this company
    if (updates.slug && updates.slug !== existing.slug) {
      const slugTaken = await db.query.jobs.findFirst({
        where: and(
          eq(jobs.companyId, existing.companyId),
          eq(jobs.slug, updates.slug as string),
        ),
        columns: { id: true },
      });

      if (slugTaken) {
        return c.json(
          { error: "A job with this slug already exists for this company" },
          409,
        );
      }
    }

    // If transitioning to published, enforce plan limits
    if (updates.status === "published" && existing.status !== "published") {
      const company = await db.query.companies.findFirst({
        where: eq(companies.id, existing.companyId),
      });

      const plan = company?.plan ?? "free";

      if (plan === "free") {
        return c.json(
          { error: "Free plan does not allow publishing jobs. Please upgrade." },
          403,
        );
      }

      if (plan === "starter") {
        const [publishedCount] = await db
          .select({ count: count() })
          .from(jobs)
          .where(
            and(
              eq(jobs.companyId, existing.companyId),
              eq(jobs.status, "published"),
            ),
          );

        if (publishedCount.count >= 3) {
          return c.json(
            {
              error:
                "Starter plan allows a maximum of 3 published jobs. Please upgrade.",
            },
            403,
          );
        }
      }

      // Set publishedAt on transition to published
      updates.publishedAt = new Date();
    }

    const [updated] = await db
      .update(jobs)
      .set(updates)
      .where(and(eq(jobs.id, jobId), eq(jobs.userId, userId)))
      .returning();

    return c.json(updated);
  })

  // ─── Protected: Delete a job ───────────────────────────────────────
  .delete("/:id", authMiddleware, async (c) => {
    const userId = c.get("userId" as never) as string;
    const jobId = c.req.param("id")!;

    const [deleted] = await db
      .delete(jobs)
      .where(and(eq(jobs.id, jobId), eq(jobs.userId, userId)))
      .returning({ id: jobs.id });

    if (!deleted) {
      return c.json({ error: "Job not found" }, 404);
    }

    return c.json({ success: true, id: deleted.id });
  })

  // ─── Protected: Apply to a job ─────────────────────────────────────
  .post("/:id/apply", authMiddleware, async (c) => {
    const userId = c.get("userId" as never) as string;
    const jobId = c.req.param("id")!;
    const body = await c.req.json();

    // Verify the job exists and is published
    const job = await db.query.jobs.findFirst({
      where: and(eq(jobs.id, jobId), eq(jobs.status, "published")),
      columns: { id: true, userId: true },
    });

    if (!job) {
      return c.json({ error: "Job not found or not accepting applications" }, 404);
    }

    // Prevent applying to your own job
    if (job.userId === userId) {
      return c.json({ error: "Cannot apply to your own job" }, 400);
    }

    // Check for existing application
    const existingApp = await db.query.applications.findFirst({
      where: and(
        eq(applications.userId, userId),
        eq(applications.jobId, jobId),
      ),
      columns: { id: true },
    });

    if (existingApp) {
      return c.json({ error: "You have already applied to this job" }, 409);
    }

    const { coverLetter, resumeUrl } = body;

    const [application] = await db
      .insert(applications)
      .values({
        id: crypto.randomUUID(),
        userId,
        jobId,
        coverLetter: coverLetter ?? null,
        resumeUrl: resumeUrl ?? null,
        status: "pending",
      })
      .returning();

    return c.json(application, 201);
  })

  // ─── Protected: Get applicants for a job (owner only) ──────────────
  .get("/:id/applicants", authMiddleware, async (c) => {
    const userId = c.get("userId" as never) as string;
    const jobId = c.req.param("id")!;

    // Verify the job belongs to the current user
    const job = await db.query.jobs.findFirst({
      where: and(eq(jobs.id, jobId), eq(jobs.userId, userId)),
      columns: { id: true },
    });

    if (!job) {
      return c.json({ error: "Job not found" }, 404);
    }

    const applicants = await db.query.applications.findMany({
      where: eq(applications.jobId, jobId),
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: [desc(applications.createdAt)],
    });

    return c.json(applicants);
  })

  // ─── Protected: Toggle save/unsave a job ───────────────────────────
  .post("/:id/save", authMiddleware, async (c) => {
    const userId = c.get("userId" as never) as string;
    const jobId = c.req.param("id")!;

    // Verify the job exists
    const job = await db.query.jobs.findFirst({
      where: eq(jobs.id, jobId),
      columns: { id: true },
    });

    if (!job) {
      return c.json({ error: "Job not found" }, 404);
    }

    // Check if already saved
    const existingSave = await db.query.savedJobs.findFirst({
      where: and(
        eq(savedJobs.userId, userId),
        eq(savedJobs.jobId, jobId),
      ),
    });

    if (existingSave) {
      // Unsave
      await db
        .delete(savedJobs)
        .where(
          and(eq(savedJobs.userId, userId), eq(savedJobs.jobId, jobId)),
        );
      return c.json({ saved: false });
    }

    // Save
    await db.insert(savedJobs).values({
      id: crypto.randomUUID(),
      userId,
      jobId,
    });

    return c.json({ saved: true }, 201);
  })

  // ─── Protected: Update application status (job owner only) ─────────
  .patch("/applications/:applicationId", authMiddleware, async (c) => {
    const userId = c.get("userId" as never) as string;
    const applicationId = c.req.param("applicationId")!;
    const body = await c.req.json();

    const { status } = body;
    const validStatuses = ["pending", "reviewed", "accepted", "rejected"];

    if (!status || !validStatuses.includes(status)) {
      return c.json(
        {
          error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        },
        400,
      );
    }

    // Find the application and verify the current user owns the job
    const application = await db.query.applications.findFirst({
      where: eq(applications.id, applicationId),
      with: {
        job: {
          columns: { userId: true },
        },
      },
    });

    if (!application) {
      return c.json({ error: "Application not found" }, 404);
    }

    if (application.job.userId !== userId) {
      return c.json({ error: "Not authorized to update this application" }, 403);
    }

    const [updated] = await db
      .update(applications)
      .set({ status })
      .where(eq(applications.id, applicationId))
      .returning();

    return c.json(updated);
  });

export default app;
