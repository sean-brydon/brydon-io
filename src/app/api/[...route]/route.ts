import { Hono } from "hono";
import { handle } from "hono/vercel";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import users from "@/api/routes/users";
import posts from "@/api/routes/posts";
import projects from "@/api/routes/projects";
import work from "@/api/routes/work";
import sections from "@/api/routes/sections";
import follow from "@/api/routes/follow";
import reactions from "@/api/routes/reactions";
import comments from "@/api/routes/comments";
import feed from "@/api/routes/feed";
import notifications from "@/api/routes/notifications";
import billing from "@/api/routes/billing";
import companies from "@/api/routes/companies";
import jobs from "@/api/routes/jobs";
import views from "@/api/routes/views";

// ─── Main Hono app ───────────────────────────────────────────────────
const app = new Hono().basePath("/api");

// ─── Global middleware ───────────────────────────────────────────────
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: (origin) => origin, // reflect origin for credentials
    credentials: true,
    allowMethods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

// ─── Better Auth ─────────────────────────────────────────────────────
// Auth is handled by the dedicated /api/auth/[...all]/route.ts handler
// using better-auth's toNextJsHandler (more reliable with Next.js).
// The Hono middleware reads sessions via auth.api.getSession().

// ─── Health check ────────────────────────────────────────────────────
app.get("/health", (c) =>
  c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  })
);

// ─── Mount routes ────────────────────────────────────────────────────
app.route("/users", users);
app.route("/posts", posts);
app.route("/projects", projects);
app.route("/work", work);
app.route("/sections", sections);
app.route("/follow", follow);
app.route("/reactions", reactions);
app.route("/comments", comments);
app.route("/feed", feed);
app.route("/notifications", notifications);
app.route("/billing", billing);
app.route("/companies", companies);
app.route("/jobs", jobs);
app.route("/views", views);

// ─── 404 fallback ────────────────────────────────────────────────────
app.notFound((c) =>
  c.json({ error: "Not found", path: c.req.path }, 404)
);

// ─── Error handler ───────────────────────────────────────────────────
app.onError((err, c) => {
  console.error(`[API Error] ${c.req.method} ${c.req.path}:`, err);
  return c.json(
    {
      error: "Internal server error",
      ...(process.env.NODE_ENV === "development" && {
        message: err.message,
      }),
    },
    500
  );
});

// ─── Export handlers for Next.js App Router ──────────────────────────
export const GET = handle(app);
export const POST = handle(app);
export const PATCH = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app);
export const OPTIONS = handle(app);
