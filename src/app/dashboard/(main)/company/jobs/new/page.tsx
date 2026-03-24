import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { companies } from "@/db/schema";
import { JobForm } from "../job-form";

export const metadata = { title: "new job" };

export default async function NewJobPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");
  const company = await db.query.companies.findFirst({ where: eq(companies.userId, session.user.id) });
  if (!company) redirect("/dashboard/company");

  return (
    <div>
      <nav className="mb-6"><Link href="/dashboard/company/jobs" className="text-xs no-underline" style={{ color: "var(--text-muted)" }}>← back to jobs</Link></nav>
      <h1 className="text-xl font-bold mb-6" style={{ color: "var(--text)" }}>new job</h1>
      <JobForm mode="new" companyId={company.id} />
    </div>
  );
}
