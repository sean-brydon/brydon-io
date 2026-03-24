import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { ProfileEditor } from "./profile-editor";

export const metadata: Metadata = {
  title: "edit profile",
};

export default async function ProfileEditorPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { profileHtml: true },
  });

  return <ProfileEditor initialContent={user?.profileHtml ?? ""} />;
}
