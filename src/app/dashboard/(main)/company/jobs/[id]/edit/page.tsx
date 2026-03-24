import { redirect, notFound } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { companies, jobs } from "@/db/schema";
import { JobForm } from "../../job-form";

export default async function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const company = await db.query.companies.findFirst({ where: eq(companies.userId, session.user.id) });
  if (!company) redirect("/dashboard/company");

  const job = await db.query.jobs.findFirst({ where: and(eq(jobs.id, id), eq(jobs.companyId, company.id)) });
  if (!job) notFound();

  return (
    <div>
      <nav className="mb-6"><Link href="/dashboard/company/jobs" className="text-xs no-underline" style={{ color: "var(--text-muted)" }}>← back to jobs</Link></nav>
      <h1 className="text-xl font-bold mb-6" style={{ color: "var(--text)" }}>edit job</h1>
      <JobForm mode="edit" job={job as any} companyId={company.id} />
    </div>
  );
}
