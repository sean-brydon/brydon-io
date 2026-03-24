import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schemas/auth";
import { workExperiences, projects } from "@/db/schemas/content";
import { OnboardingStepper } from "./onboarding-stepper";

// ─── Metadata ──────────────────────────────────────────────────────────
export const metadata = {
  title: "Onboarding — devl.dev",
  description: "Set up your profile in a few quick steps.",
};

// ─── Onboarding Page (Server Component) ───────────────────────────────
// 1. If not authenticated → redirect to /sign-in
// 2. If user already completed onboarding → redirect to /dashboard
// 3. Otherwise → render the client-side OnboardingStepper
//
// Completion is detected by checking:
//   a) user.profileHtml is set (always written on stepper completion), OR
//   b) user has existing work experiences or projects
export default async function OnboardingPage() {
  // ── Auth check ──────────────────────────────────────────────────────
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in?callbackUrl=/onboarding");
  }

  const userId = session.user.id;

  // ── Completion check — skip onboarding if user already completed ────
  const [userRecord, existingWork, existingProjects] = await Promise.all([
    db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { profileHtml: true },
    }),
    db.query.workExperiences.findFirst({
      where: eq(workExperiences.userId, userId),
      columns: { id: true },
    }),
    db.query.projects.findFirst({
      where: eq(projects.userId, userId),
      columns: { id: true },
    }),
  ]);

  if (userRecord?.profileHtml != null || existingWork || existingProjects) {
    redirect("/dashboard");
  }

  // ── Render stepper with user context ────────────────────────────────
  return (
    <OnboardingStepper
      user={{
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image ?? null,
      }}
    />
  );
}
