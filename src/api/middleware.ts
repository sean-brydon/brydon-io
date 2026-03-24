import type { Context, Next } from "hono";
import { auth } from "@/lib/auth";

// ─── Hono context type for authenticated routes ──────────────────────
export type AuthEnv = {
  Variables: {
    userId: string;
    user: typeof auth.$Infer.Session.user;
    session: typeof auth.$Infer.Session.session;
  };
};

/**
 * Auth middleware for Hono routes.
 * Uses better-auth's getSession to verify the cookie/session from the request.
 * Sets `userId`, `user`, and `session` on the Hono context.
 *
 * @see https://better-auth.com/docs/integrations/hono
 */
export async function authMiddleware(c: Context, next: Next) {
  try {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (!session?.user?.id) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    c.set("userId", session.user.id);
    c.set("user", session.user);
    c.set("session", session.session);
    await next();
  } catch {
    return c.json({ error: "Unauthorized" }, 401);
  }
}
