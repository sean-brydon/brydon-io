import { notFound } from "next/navigation";
import Link from "next/link";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { jobs, companies } from "@/db/schema";
import { PostContent } from "@/components/post-content";
import { ApplyForm } from "./apply-form";

interface Props {
  params: Promise<{ company: string; slug: string }>;
}

function formatSalary(min: string | null, max: string | null, currency: string | null) {
  if (!min && !max) return null;
  const c = currency ?? "USD";
  const minK = min ? Math.round(parseInt(min) / 1000) : null;
  const maxK = max ? Math.round(parseInt(max) / 1000) : null;
  if (minK && maxK) return `$${minK}k – $${maxK}k ${c}`;
  if (minK) return `From $${minK}k ${c}`;
  return `Up to $${maxK}k ${c}`;
}

export default async function JobDetailPage({ params }: Props) {
  const { company: companySlug, slug } = await params;

  const [result] = await db
    .select({
      id: jobs.id,
      title: jobs.title,
      description: jobs.description,
      location: jobs.location,
      remotePolicy: jobs.remotePolicy,
      employmentType: jobs.employmentType,
      experienceLevel: jobs.experienceLevel,
      salaryMin: jobs.salaryMin,
      salaryMax: jobs.salaryMax,
      salaryCurrency: jobs.salaryCurrency,
      tags: jobs.tags,
      applyUrl: jobs.applyUrl,
      createdAt: jobs.createdAt,
      companyName: companies.name,
      companySlug: companies.slug,
      companyLogo: companies.logo,
      companyWebsite: companies.website,
    })
    .from(jobs)
    .innerJoin(companies, eq(jobs.companyId, companies.id))
    .where(and(eq(companies.slug, companySlug), eq(jobs.slug, slug), eq(jobs.status, "published")));

  if (!result) notFound();

  const salary = formatSalary(result.salaryMin, result.salaryMax, result.salaryCurrency);

  return (
    <div className="max-w-[640px] mx-auto px-5 py-12">
      <nav className="mb-8">
        <Link href="/jobs" className="text-xs no-underline" style={{ color: "var(--text-muted)" }}>
          ← back to jobs
        </Link>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          {result.companyLogo && (
            <img src={result.companyLogo} alt="" className="w-10 h-10 rounded-lg object-cover" />
          )}
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>{result.title}</h1>
            <Link href={`/company/${result.companySlug}`} className="text-xs no-underline" style={{ color: "var(--accent)" }}>
              {result.companyName} ↗
            </Link>
          </div>
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            result.location,
            result.remotePolicy,
            result.employmentType,
            result.experienceLevel,
            salary,
          ].filter(Boolean).map((item, i) => (
            <span key={i} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "var(--card-bg)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
              {item}
            </span>
          ))}
        </div>

        {(result.tags as string[])?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {(result.tags as string[]).map((tag) => (
              <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "color-mix(in srgb, var(--accent) 10%, transparent)", color: "var(--accent)", border: "1px solid color-mix(in srgb, var(--accent) 20%, transparent)" }}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Description */}
      <div className="prose-custom mb-10">
        <PostContent source={result.description ?? ""} />
      </div>

      {/* Apply */}
      <div className="pt-8" style={{ borderTop: "1px solid var(--border)" }}>
        <h2 className="text-sm font-bold mb-4" style={{ color: "var(--text)" }}>apply</h2>
        {result.applyUrl ? (
          <a
            href={result.applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-xs no-underline px-5 py-2.5 rounded-lg font-medium"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            apply externally ↗
          </a>
        ) : (
          <ApplyForm jobId={result.id} />
        )}
      </div>
    </div>
  );
}
