import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { companies } from "@/db/schema";
import { EditCompanyForm } from "./edit-company-form";

export const metadata = { title: "edit company" };

export default async function EditCompanyPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const company = await db.query.companies.findFirst({
    where: eq(companies.userId, session.user.id),
  });

  if (!company) redirect("/dashboard/company");

  return (
    <div>
      <h1 className="text-xl font-bold mb-2" style={{ color: "var(--text)" }}>edit company</h1>
      <p className="text-xs mb-8" style={{ color: "var(--text-muted)" }}>update your company profile</p>
      <EditCompanyForm company={company} />
    </div>
  );
}
