import type { Metadata } from "next";
import Link from "next/link";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { jobs, companies, users } from "@/db/schema";

export const metadata: Metadata = {
  title: "jobs",
  description: "browse open positions from companies on brydon.io",
};

function formatSalary(
  min: string | null,
  max: string | null,
  currency: string,
): string | null {
  if (!min && !max) return null;
  const fmt = (v: string) => `${Math.round(parseInt(v) / 1000)}k`;
  const lo = min ? fmt(min) : "";
  const hi = max ? fmt(max) : "";
  const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "";
  if (lo && hi && lo !== hi) return `${symbol}${lo} – ${symbol}${hi}`;
  return `${symbol}${lo || hi}`;
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export default async function JobBoardPage() {
  const jobList = await db
    .select({
      id: jobs.id,
      title: jobs.title,
      slug: jobs.slug,
      location: jobs.location,
      remotePolicy: jobs.remotePolicy,
      employmentType: jobs.employmentType,
      experienceLevel: jobs.experienceLevel,
      salaryMin: jobs.salaryMin,
      salaryMax: jobs.salaryMax,
      salaryCurrency: jobs.salaryCurrency,
      tags: jobs.tags,
      createdAt: jobs.createdAt,
      companyName: companies.name,
      companySlug: companies.slug,
      companyLogo: companies.logo,
      username: users.username,
    })
    .from(jobs)
    .innerJoin(companies, eq(jobs.companyId, companies.id))
    .innerJoin(users, eq(companies.userId, users.id))
    .where(eq(jobs.status, "published"))
    .orderBy(desc(jobs.createdAt))
    .limit(50);

  return (
    <div className="max-w-[640px] mx-auto px-5 py-20">
      <div className="mb-8">
        <div className="flex items-baseline justify-between mb-2">
          <h1
            className="text-xl font-bold"
            style={{ color: "var(--text)" }}
          >
            jobs
          </h1>
          <Link
            href="/"
            className="text-xs no-underline hover:underline"
            style={{ color: "var(--text-muted)" }}
          >
            ← home
          </Link>
        </div>
        <p
          className="text-xs"
          style={{ color: "var(--text-muted)" }}
        >
          open positions from companies on brydon.io
        </p>
      </div>

      {jobList.length === 0 ? (
        <div
          className="text-center py-16 rounded-lg"
          style={{ border: "1px dashed var(--border)" }}
        >
          <p
            className="text-xs mb-2"
            style={{ color: "var(--text-muted)" }}
          >
            no open positions right now
          </p>
          <p
            className="text-xs"
            style={{ color: "var(--text-muted)", opacity: 0.6 }}
          >
            check back soon — new jobs are posted regularly
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobList.map((job) => {
            const salary = formatSalary(
              job.salaryMin,
              job.salaryMax,
              job.salaryCurrency,
            );

            return (
              <Link
                key={job.id}
                href={`/jobs/${job.username}/${job.companySlug}/${job.slug}`}
                className="block no-underline p-4 rounded-lg transition-colors hover:opacity-80"
                style={{
                  background: "var(--card-bg)",
                  border: "1px solid var(--border)",
                }}
              >
                <div className="flex items-start gap-3">
                  {/* Company logo */}
                  {job.companyLogo ? (
                    <img
                      src={job.companyLogo}
                      alt={job.companyName}
                      className="w-8 h-8 rounded-md object-cover shrink-0"
                      style={{ border: "1px solid var(--border)" }}
                    />
                  ) : (
                    <div
                      className="w-8 h-8 rounded-md shrink-0 flex items-center justify-center text-xs font-bold"
                      style={{
                        background: "var(--border)",
                        color: "var(--text-muted)",
                      }}
                    >
                      {job.companyName.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    {/* Title + company */}
                    <h3
                      className="text-sm font-semibold truncate"
                      style={{ color: "var(--text)" }}
                    >
                      {job.title}
                    </h3>
                    <p
                      className="text-[11px] mt-0.5"
                      style={{ color: "var(--text-muted)", opacity: 0.8 }}
                    >
                      {job.companyName}
                      {job.location && ` · ${job.location}`}
                    </p>

                    {/* Tags row */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full"
                        style={{
                          background: "color-mix(in srgb, var(--accent) 15%, transparent)",
                          color: "var(--accent)",
                          border: "1px solid color-mix(in srgb, var(--accent) 30%, transparent)",
                        }}
                      >
                        {job.remotePolicy}
                      </span>
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full"
                        style={{
                          background: "var(--card-bg)",
                          color: "var(--text-muted)",
                          border: "1px solid var(--border)",
                        }}
                      >
                        {job.employmentType}
                      </span>
                      {job.experienceLevel && (
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full"
                          style={{
                            background: "var(--card-bg)",
                            color: "var(--text-muted)",
                            border: "1px solid var(--border)",
                          }}
                        >
                          {job.experienceLevel}
                        </span>
                      )}
                      {salary && (
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full"
                          style={{
                            background: "var(--card-bg)",
                            color: "var(--text-muted)",
                            border: "1px solid var(--border)",
                          }}
                        >
                          {salary}
                        </span>
                      )}
                    </div>

                    {/* Extra tags */}
                    {job.tags && job.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {job.tags.slice(0, 4).map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] px-1.5 py-0.5 rounded"
                            style={{
                              color: "var(--text-muted)",
                              opacity: 0.7,
                            }}
                          >
                            #{tag}
                          </span>
                        ))}
                        {job.tags.length > 4 && (
                          <span
                            className="text-[10px] px-1.5 py-0.5"
                            style={{ color: "var(--text-muted)", opacity: 0.5 }}
                          >
                            +{job.tags.length - 4}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Timestamp */}
                  <span
                    className="text-[10px] shrink-0 mt-0.5"
                    style={{ color: "var(--text-muted)", opacity: 0.5 }}
                  >
                    {timeAgo(job.createdAt)}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
