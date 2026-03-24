import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { companies, jobs } from "@/db/schema";

export const metadata = { title: "manage jobs" };

export default async function ManageJobsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const company = await db.query.companies.findFirst({ where: eq(companies.userId, session.user.id) });
  if (!company) redirect("/dashboard/company");

  const companyJobs = await db.query.jobs.findMany({
    where: eq(jobs.companyId, company.id),
    orderBy: [desc(jobs.updatedAt)],
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold mb-1" style={{ color: "var(--text)" }}>jobs</h1>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>manage your job postings</p>
        </div>
        <Link href="/dashboard/company/jobs/new" className="text-xs no-underline px-4 py-2 rounded-lg font-medium" style={{ background: "var(--accent)", color: "#fff" }}>
          new job
        </Link>
      </div>

      {companyJobs.length === 0 ? (
        <div className="text-center py-16 rounded-lg" style={{ border: "1px dashed var(--border)" }}>
          <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>no jobs yet</p>
          <Link href="/dashboard/company/jobs/new" className="text-xs no-underline" style={{ color: "var(--accent)" }}>create your first job →</Link>
        </div>
      ) : (
        <div className="space-y-0">
          {companyJobs.map((job) => (
            <Link key={job.id} href={`/dashboard/company/jobs/${job.id}/edit`} className="flex items-center justify-between py-3 -mx-3 px-3 rounded-lg no-underline transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
              <div>
                <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>{job.title}</h3>
                <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)", opacity: 0.6 }}>
                  {job.location ?? "remote"} · {job.employmentType}
                </p>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full" style={{
                background: job.status === "published" ? "color-mix(in srgb, var(--accent) 15%, transparent)" : "var(--card-bg)",
                color: job.status === "published" ? "var(--accent)" : "var(--text-muted)",
                border: `1px solid ${job.status === "published" ? "color-mix(in srgb, var(--accent) 30%, transparent)" : "var(--border)"}`,
              }}>{job.status}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
