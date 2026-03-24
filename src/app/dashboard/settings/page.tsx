import type { Metadata } from "next";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "settings" };

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = await db.query.users.findFirst({
    where: eq(users.id, session!.user.id),
  });

  if (!user) return null;

  return (
    <div>
      <h1 className="text-xl font-bold mb-2" style={{ color: "var(--text)" }}>settings</h1>
      <p className="text-xs mb-8" style={{ color: "var(--text-muted)" }}>manage your account and portfolio settings</p>
      <SettingsForm user={user} />
    </div>
  );
}
