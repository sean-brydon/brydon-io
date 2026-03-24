import type { Metadata } from "next";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { sections } from "@/db/schema";
import SectionsManager from "./sections-manager";

export const metadata: Metadata = { title: "sections" };

export default async function SectionsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const userSections = await db.query.sections.findMany({
    where: eq(sections.userId, session!.user.id),
    orderBy: [sections.order],
  });

  return <SectionsManager initialSections={userSections} />;
}
