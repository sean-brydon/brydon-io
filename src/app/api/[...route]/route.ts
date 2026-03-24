import { Hono } from "hono";
import { handle } from "hono/vercel";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import users from "@/api/routes/users";
import posts from "@/api/routes/posts";
import projects from "@/api/routes/projects";
import work from "@/api/routes/work";
import sections from "@/api/routes/sections";

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
