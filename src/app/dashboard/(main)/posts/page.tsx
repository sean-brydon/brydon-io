import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { desc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { posts } from "@/db/schema";

export const metadata: Metadata = { title: "posts" };

export default async function PostsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const userPosts = await db.query.posts.findMany({
    where: eq(posts.userId, session!.user.id),
    orderBy: [desc(posts.updatedAt)],
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold mb-1" style={{ color: "var(--text)" }}>posts</h1>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>write and manage your blog posts</p>
        </div>
        <Link
          href="/dashboard/posts/new"
          className="text-xs no-underline px-4 py-2 rounded-lg font-medium transition-opacity hover:opacity-90"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          new post
        </Link>
      </div>

      {userPosts.length === 0 ? (
        <div className="text-center py-16 rounded-lg" style={{ border: "1px dashed var(--border)" }}>
          <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>no posts yet</p>
          <Link href="/dashboard/posts/new" className="text-xs no-underline" style={{ color: "var(--accent)" }}>
            write your first post →
          </Link>
        </div>
      ) : (
        <div className="space-y-0">
          {userPosts.map((post) => (
            <Link
              key={post.id}
              href={`/dashboard/posts/${post.id}/edit`}
              className="flex items-center justify-between py-3 -mx-3 px-3 rounded-lg no-underline transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
            >
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold truncate" style={{ color: "var(--text)" }}>
                  {post.title}
                </h3>
                <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)", opacity: 0.6 }}>
                  {post.slug} · {new Date(post.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </p>
              </div>
              <span
                className="text-[10px] px-2 py-0.5 rounded-full shrink-0 ml-3"
                style={{
                  background: post.status === "published" ? "color-mix(in srgb, var(--accent) 15%, transparent)" : "var(--card-bg)",
                  color: post.status === "published" ? "var(--accent)" : "var(--text-muted)",
                  border: `1px solid ${post.status === "published" ? "color-mix(in srgb, var(--accent) 30%, transparent)" : "var(--border)"}`,
                }}
              >
                {post.status}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
