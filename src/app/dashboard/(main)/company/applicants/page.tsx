import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { companies, jobs, applications, users } from "@/db/schema";

export const metadata = { title: "applicants" };

export default async function ApplicantsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const company = await db.query.companies.findFirst({ where: eq(companies.userId, session.user.id) });
  if (!company) redirect("/dashboard/company");

  const apps = await db
    .select({
      id: applications.id,
      status: applications.status,
      coverLetter: applications.coverLetter,
      createdAt: applications.createdAt,
      jobTitle: jobs.title,
      jobId: jobs.id,
      userName: users.name,
      userUsername: users.username,
      userImage: users.image,
      userHeadline: users.headline,
    })
    .from(applications)
    .innerJoin(jobs, eq(applications.jobId, jobs.id))
    .innerJoin(users, eq(applications.userId, users.id))
    .where(eq(jobs.companyId, company.id))
    .orderBy(desc(applications.createdAt));

  // Group by job
  const grouped: Record<string, typeof apps> = {};
  for (const app of apps) {
    const key = app.jobTitle;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(app);
  }

  return (
    <div>
      <h1 className="text-xl font-bold mb-2" style={{ color: "var(--text)" }}>applicants</h1>
      <p className="text-xs mb-8" style={{ color: "var(--text-muted)" }}>review applications to your job postings</p>

      {apps.length === 0 ? (
        <div className="text-center py-16 rounded-lg" style={{ border: "1px dashed var(--border)" }}>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>no applications yet</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([jobTitle, jobApps]) => (
            <div key={jobTitle}>
              <h2 className="text-xs uppercase tracking-wider mb-4" style={{ color: "var(--text-muted)", opacity: 0.5 }}>{jobTitle}</h2>
              <div className="space-y-3">
                {jobApps.map((app) => (
                  <div key={app.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "var(--card-bg)", border: "1px solid var(--border)" }}>
                    <div className="flex items-center gap-3">
                      {app.userImage ? (
                        <img src={app.userImage} alt="" className="w-8 h-8 rounded-full" />
                      ) : (
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: "var(--accent)", color: "#fff" }}>{app.userName?.[0]?.toUpperCase()}</div>
                      )}
                      <div>
                        <Link href={`/${app.userUsername}`} className="text-sm font-semibold no-underline" style={{ color: "var(--text)" }}>{app.userName}</Link>
                        {app.userHeadline && <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{app.userHeadline}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px]" style={{ color: "var(--text-muted)", opacity: 0.5 }}>{new Date(app.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full" style={{
                        background: app.status === "accepted" ? "color-mix(in srgb, #22c55e 15%, transparent)" : app.status === "rejected" ? "color-mix(in srgb, #ef4444 15%, transparent)" : "var(--card-bg)",
                        color: app.status === "accepted" ? "#22c55e" : app.status === "rejected" ? "#ef4444" : "var(--text-muted)",
                        border: "1px solid var(--border)",
                      }}>{app.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
