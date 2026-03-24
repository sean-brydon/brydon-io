import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { companies } from "@/db/schema";
import { BillingPanel } from "./billing-panel";

export const metadata = { title: "billing" };

export default async function BillingPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const company = await db.query.companies.findFirst({ where: eq(companies.userId, session.user.id) });
  if (!company) redirect("/dashboard/company");

  return (
    <div>
      <h1 className="text-xl font-bold mb-2" style={{ color: "var(--text)" }}>billing</h1>
      <p className="text-xs mb-8" style={{ color: "var(--text-muted)" }}>manage your subscription and plan</p>
      <BillingPanel companyId={company.id} currentPlan={company.plan} hasStripe={!!company.stripeCustomerId} />
    </div>
  );
}
