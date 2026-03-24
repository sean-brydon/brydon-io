import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { users, posts as postsTable } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export const metadata: Metadata = {
  title: "blog",
};

interface Props {
  params: Promise<{ username: string }>;
}

export default async function UserBlogPage({ params }: Props) {
  const { username } = await params;

  const user = await db.query.users.findFirst({
    where: eq(users.username, username),
    columns: { id: true },
  });

  if (!user) {
    notFound();
  }

  const posts = await db.query.posts.findMany({
    where: and(
      eq(postsTable.userId, user.id),
      eq(postsTable.status, "published")
    ),
    orderBy: [desc(postsTable.publishedAt)],
    columns: {
      slug: true,
      title: true,
      description: true,
      publishedAt: true,
    },
  });

  return (
    <div className="max-w-[640px] mx-auto px-5 py-12">
      <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--text)" }}>
        blog
      </h1>
      <p className="text-sm mb-12" style={{ color: "var(--text-muted)" }}>
        writing about code, design, and things i learn.
      </p>

      {posts.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--text-muted)", opacity: 0.5 }}>
          no posts yet. check back soon.
        </p>
      ) : (
        <div className="space-y-0">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/${username}/blog/${post.slug}`}
              className="block no-underline py-4 -mx-4 px-4 rounded-lg transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
              style={{ color: "var(--text)" }}
            >
              <div className="flex items-baseline justify-between mb-1">
                <h2 className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                  {post.title}
                </h2>
                <time
                  dateTime={post.publishedAt?.toISOString() ?? ""}
                  className="text-[11px] shrink-0 ml-4"
                  style={{ color: "var(--text-muted)", opacity: 0.5 }}
                >
                  {post.publishedAt
                    ? post.publishedAt.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : ""}
                </time>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                {post.description}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
