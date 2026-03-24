import type { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

// ─── Dashboard Root Layout (Server Component) ─────────────────────────────────
// Performs full DB-backed session validation. The Edge middleware (`src/middleware.ts`)
// only checks for cookie existence — this layout verifies the session is valid and
// not expired by querying the database through Better Auth.
//
// Route groups beneath this layout provide the actual UI chrome:
//   (main)   → sidebar + constrained content area (default dashboard pages)
//   (editor) → full-page layout with no sidebar (post editor)
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Session invalid, expired, or cookie was forged → redirect to sign-in
  if (!session) {
    redirect("/sign-in?callbackUrl=/dashboard");
  }

  return <>{children}</>;
}
