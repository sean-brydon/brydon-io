import type { Metadata } from "next";
import { headers } from "next/headers";
import { desc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { ProjectsManager } from "./projects-manager";

export const metadata: Metadata = { title: "projects" };

export default async function ProjectsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const userProjects = await db.query.projects.findMany({
    where: eq(projects.userId, session!.user.id),
    orderBy: [desc(projects.featured), desc(projects.createdAt)],
  });

  const serialized = userProjects.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    url: p.url,
    repoUrl: p.repoUrl,
    tags: p.tags,
    featured: p.featured,
  }));

  return <ProjectsManager projects={serialized} />;
}
