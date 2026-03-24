import type { Metadata } from "next";
import { headers } from "next/headers";
import { desc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { workExperiences } from "@/db/schema";
import { ExperienceList } from "./experience-list";

export const metadata: Metadata = { title: "experience" };

export default async function ExperiencePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const experiences = await db.query.workExperiences.findMany({
    where: eq(workExperiences.userId, session!.user.id),
    orderBy: [desc(workExperiences.startDate)],
  });

  // Serialize Date objects to ISO strings for client component
  const serialized = experiences.map((exp) => ({
    ...exp,
    startDate: exp.startDate.toISOString(),
    endDate: exp.endDate ? exp.endDate.toISOString() : null,
    createdAt: exp.createdAt.toISOString(),
    updatedAt: exp.updatedAt.toISOString(),
  }));

  return <ExperienceList initial={serialized} />;
}
