import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import type { Metadata } from "next";
import { UserNav } from "@/components/user-nav";
import { UserFooter } from "@/components/user-footer";
import { db } from "@/db";
import { users, sections } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export interface UserProfile {
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  githubUsername: string;
  twitterHandle: string;
  calUsername: string | null;
}

/**
 * Fetches a user profile from the database by username.
 * Also queries the "contact" section for calUsername.
 */
async function getUserByUsername(username: string): Promise<UserProfile | null> {
  const dbUser = await db.query.users.findFirst({
    where: eq(users.username, username),
  });

  if (!dbUser) return null;

  // Fetch calUsername from the user's "contact" section config
  const contactSection = await db.query.sections.findFirst({
    where: and(eq(sections.userId, dbUser.id), eq(sections.type, "contact")),
  });

  const calUsername = (contactSection?.config as Record<string, unknown>)?.calUsername as string | null ?? null;

  return {
    username: dbUser.username ?? username,
    displayName: dbUser.name,
    bio: dbUser.bio ?? "",
    avatarUrl: dbUser.image ?? "",
    githubUsername: dbUser.githubUsername ?? "",
    twitterHandle: dbUser.twitterUsername ?? "",
    calUsername,
  };
}

interface Props {
  params: Promise<{ username: string }>;
  children: ReactNode;
}

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params;
  const user = await getUserByUsername(username);
  if (!user) return {};
  return {
    title: {
      default: user.displayName,
      template: `%s — ${user.displayName}`,
    },
    description: user.bio.replace(/<[^>]*>/g, ""), // strip html for meta
  };
}

export default async function UserLayout({ params, children }: Props) {
  const { username } = await params;
  const user = await getUserByUsername(username);

  if (!user) notFound();

  return (
    <div className="min-h-screen flex flex-col">
      <UserNav user={user} />
      <main className="flex-1">{children}</main>
      <UserFooter user={user} />
    </div>
  );
}
