import { Hono } from "hono";
import { eq } from "drizzle-orm";
import DOMPurify from "isomorphic-dompurify";
import { db } from "@/db";
import {
  users,
  sections,
  projects,
  workExperiences,
} from "@/db/schema";
import { authMiddleware } from "@/api/middleware";

/**
 * Sanitize profile HTML to prevent stored XSS.
 * Allows standard rich-text tags plus tiptap custom block nodes
 * (currently-block, tech-stack-block, github-block, contact-block,
 * education-block, hero-block, image-upload, horizontal-rule, etc.) which use
 * `div[data-type="..."]` and associated data-* attributes for state.
 */
function sanitizeProfileHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      // Block elements
      "p", "h1", "h2", "h3", "h4", "h5", "h6",
      "blockquote", "pre", "code", "hr", "br",
      "ul", "ol", "li",
      "table", "thead", "tbody", "tr", "th", "td",
      "div", "figure", "figcaption",
      // Inline elements
      "a", "strong", "em", "b", "i", "u", "s", "del",
      "sub", "sup", "mark", "span",
      // Media
      "img",
      // Tiptap task list elements
      "input", "label",
    ],
    ALLOWED_ATTR: [
      // Links
      "href", "target", "rel",
      // Images
      "src", "alt", "title", "width", "height", "loading",
      // Styling hooks
      "class", "id",
      // Tables
      "colspan", "rowspan",
      // Tiptap core data attributes
      "data-type",
      // Tiptap custom block data attributes
      "data-groups",             // tech-stack-block
      "data-categories",         // currently-block
      "data-entries",            // education-block
      "data-username",           // github-block
      "data-cal-username",       // contact-block
      "data-description",        // contact-block
      "data-background-color",   // node-background extension
      "data-checked",            // task list
      "data-color",              // highlight / color
      "data-drag-handle",        // drag handle
      // hero-block data attributes
      "data-shape1-type",        // hero-block
      "data-shape1-text",        // hero-block
      "data-shape1-svg",         // hero-block
      "data-shape2-type",        // hero-block
      "data-shape2-text",        // hero-block
      "data-shape2-svg",         // hero-block
      "data-height",             // hero-block
      "data-particle-count",     // hero-block
      "data-show-badge",         // hero-block
      "data-badge-text",         // hero-block
      // Tiptap text alignment & highlights use inline styles
      "style",
      // Task list checkbox attributes
      "type", "checked", "disabled",
    ],
    ALLOW_DATA_ATTR: false,
  });
}

const app = new Hono()

  // ─── Protected: Get current user (authenticated) ───────────────────
  // Placed before /:username so "/me" doesn't match the param route
  .get("/me", authMiddleware, async (c) => {
    const userId = c.get("userId" as never) as string;

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    return c.json(user);
  })

  // ─── Protected: Update current user's profile ──────────────────────
  .patch("/me", authMiddleware, async (c) => {
    const userId = c.get("userId" as never) as string;
    const body = await c.req.json();

    // Whitelist allowed fields
    const allowedFields = [
      "name",
      "username",
      "bio",
      "headline",
      "location",
      "websiteUrl",
      "githubUsername",
      "twitterUsername",
      "linkedinUrl",
      "image",
      "profileHtml",
    ] as const;

    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return c.json({ error: "No valid fields to update" }, 400);
    }

    // Sanitize profile HTML to prevent stored XSS
    if (typeof updates.profileHtml === "string") {
      updates.profileHtml = sanitizeProfileHtml(updates.profileHtml);
    }

    // If username is being changed, check uniqueness
    if (updates.username) {
      const existing = await db.query.users.findFirst({
        where: eq(users.username, updates.username as string),
        columns: { id: true },
      });
      if (existing && existing.id !== userId) {
        return c.json({ error: "Username already taken" }, 409);
      }
    }

    const [updated] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, userId))
      .returning();

    if (!updated) {
      return c.json({ error: "User not found" }, 404);
    }

    return c.json(updated);
  })

  // ─── Public: Get user profile by username ───────────────────────────
  .get("/:username", async (c) => {
    const username = c.req.param("username");

    const user = await db.query.users.findFirst({
      where: eq(users.username, username),
      columns: {
        id: true,
        name: true,
        username: true,
        image: true,
        bio: true,
        headline: true,
        location: true,
        websiteUrl: true,
        githubUsername: true,
        twitterUsername: true,
        linkedinUrl: true,
        createdAt: true,
      },
    });

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    // Fetch related data in parallel
    const [userSections, userProjects, userWork] = await Promise.all([
      db.query.sections.findMany({
        where: eq(sections.userId, user.id),
        orderBy: (t, { asc }) => [asc(t.order)],
      }),
      db.query.projects.findMany({
        where: eq(projects.userId, user.id),
        orderBy: (t, { desc }) => [desc(t.featured), desc(t.createdAt)],
      }),
      db.query.workExperiences.findMany({
        where: eq(workExperiences.userId, user.id),
        orderBy: (t, { desc }) => [desc(t.startDate)],
      }),
    ]);

    return c.json({
      ...user,
      sections: userSections,
      projects: userProjects,
      workExperiences: userWork,
    });
  });

export default app;
