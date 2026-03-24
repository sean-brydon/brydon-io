import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq, and, count } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { companies, jobs, applications } from "@/db/schema";
import { CreateCompanyForm } from "./create-company-form";

export const metadata: Metadata = {
  title: "company — dashboard",
};

export default async function CompanyPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/sign-in?callbackUrl=/dashboard/company");
  }

  const userId = session!.user.id;

  // Find the user's company (first one)
  const company = await db.query.companies.findFirst({
    where: eq(companies.userId, userId),
  });

  // ─── No company yet → show create form ──────────────────────────────
  if (!company) {
    return (
      <div>
        <h1 className="text-xl font-bold mb-2" style={{ color: "var(--text)" }}>
          company
        </h1>
        <p className="text-xs mb-8" style={{ color: "var(--text-muted)" }}>
          create a company to start posting jobs
        </p>

        <CreateCompanyForm />
      </div>
    );
  }

  // ─── Company exists → show overview with stats ───────────────────────
  const [totalJobsResult, publishedJobsResult, draftJobsResult, totalAppsResult] =
    await Promise.all([
      db
        .select({ count: count() })
        .from(jobs)
        .where(eq(jobs.companyId, company.id)),
      db
        .select({ count: count() })
        .from(jobs)
        .where(and(eq(jobs.companyId, company.id), eq(jobs.status, "published"))),
      db
        .select({ count: count() })
        .from(jobs)
        .where(and(eq(jobs.companyId, company.id), eq(jobs.status, "draft"))),
      db
        .select({ count: count() })
        .from(applications)
        .innerJoin(jobs, eq(applications.jobId, jobs.id))
        .where(eq(jobs.companyId, company.id)),
    ]);

  const totalJobs = totalJobsResult[0]?.count ?? 0;
  const publishedJobs = publishedJobsResult[0]?.count ?? 0;
  const draftJobs = draftJobsResult[0]?.count ?? 0;
  const totalApps = totalAppsResult[0]?.count ?? 0;

  const statCards = [
    { label: "total jobs", value: totalJobs, href: "/dashboard/company/jobs" },
    { label: "published", value: publishedJobs, href: "/dashboard/company/jobs" },
    { label: "drafts", value: draftJobs, href: "/dashboard/company/jobs" },
    { label: "applications", value: totalApps, href: "/dashboard/company/applicants" },
  ];

  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>
          company
        </h1>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          {company.plan} plan
        </span>
      </div>
      <p className="text-xs mb-8" style={{ color: "var(--text-muted)" }}>
        manage your company and job listings
      </p>

      {/* Company info card */}
      <div
        className="p-4 rounded-lg mb-6"
        style={{
          background: "var(--card-bg)",
          border: "1px solid var(--border)",
        }}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {company.logo ? (
              <img
                src={company.logo}
                alt={company.name}
                className="w-10 h-10 rounded-lg object-cover"
              />
            ) : (
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold"
                style={{ background: "var(--accent)", color: "#fff" }}
              >
                {company.name[0]?.toUpperCase()}
              </div>
            )}
            <div>
              <h2 className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                {company.name}
              </h2>
              {company.location && (
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {company.location}
                </p>
              )}
            </div>
          </div>
          <Link
            href={`/dashboard/company/settings`}
            className="text-xs hover:underline"
            style={{ color: "var(--text-muted)" }}
          >
            edit →
          </Link>
        </div>
        {company.description && (
          <p className="text-xs mt-3" style={{ color: "var(--text-muted)" }}>
            {company.description}
          </p>
        )}
        <div className="flex items-center gap-4 mt-3">
          {company.website && (
            <a
              href={company.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs hover:underline"
              style={{ color: "var(--accent)" }}
            >
              website
            </a>
          )}
          {company.industry && (
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              {company.industry}
            </span>
          )}
          {company.size && (
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              {company.size} employees
            </span>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {statCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="block no-underline p-4 rounded-lg transition-colors hover:opacity-80"
            style={{
              background: "var(--card-bg)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="flex items-baseline justify-between mb-1">
              <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                {card.label}
              </h3>
              <span
                className="text-xs"
                style={{ color: "var(--text-muted)", opacity: 0.5 }}
              >
                {card.value}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/company/jobs"
          className="inline-flex items-center text-xs font-medium px-4 py-2 rounded-lg no-underline transition-opacity hover:opacity-90"
          style={{
            background: "var(--accent)",
            color: "#fff",
          }}
        >
          manage jobs
        </Link>
        <Link
          href="/dashboard/company/applicants"
          className="inline-flex items-center text-xs font-medium px-4 py-2 rounded-lg no-underline transition-opacity hover:opacity-90"
          style={{
            background: "transparent",
            color: "var(--text-muted)",
            border: "1px solid var(--border)",
          }}
        >
          view applicants
        </Link>
        <Link
          href="/dashboard/company/billing"
          className="inline-flex items-center text-xs font-medium px-4 py-2 rounded-lg no-underline transition-opacity hover:opacity-90"
          style={{
            background: "transparent",
            color: "var(--text-muted)",
            border: "1px solid var(--border)",
          }}
        >
          billing
        </Link>
      </div>
    </div>
  );
}
