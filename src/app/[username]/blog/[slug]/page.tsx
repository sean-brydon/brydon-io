import { notFound } from "next/navigation";
import Link from "next/link";
import { PostContent } from "@/components/post-content";
import { ReactionBar } from "@/components/reaction-bar";
import { CommentsSection } from "@/components/comments-section";
import { ViewTracker } from "@/components/view-tracker";
import { db } from "@/db";
import { posts, users, postViews } from "@/db/schema";
import { eq, and, count } from "drizzle-orm";

interface Props {
  params: Promise<{ username: string; slug: string }>;
}

export async function generateStaticParams() {
  const allPosts = await db
    .select({ username: users.username, slug: posts.slug })
    .from(posts)
    .innerJoin(users, eq(posts.userId, users.id))
    .where(eq(posts.status, "published"));

  return allPosts
    .filter((p) => p.username !== null)
    .map((p) => ({ username: p.username!, slug: p.slug }));
}

async function getPostByUsernameAndSlug(username: string, slug: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.username, username),
    columns: { id: true },
  });

  if (!user) return null;

  return db.query.posts.findFirst({
    where: and(
      eq(posts.userId, user.id),
      eq(posts.slug, slug),
      eq(posts.status, "published"),
    ),
  });
}

export async function generateMetadata({ params }: Props) {
  const { username, slug } = await params;
  const post = await getPostByUsernameAndSlug(username, slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
  };
}

export default async function UserBlogPostPage({ params }: Props) {
  const { username, slug } = await params;

  const post = await getPostByUsernameAndSlug(username, slug);

  if (!post) notFound();

  // Fetch view count
  const [viewResult] = await db
    .select({ count: count() })
    .from(postViews)
    .where(eq(postViews.postId, post.id));
  const viewCount = viewResult?.count ?? 0;

  return (
    <div className="max-w-[640px] mx-auto px-5 py-12">
      <ViewTracker postId={post.id} />

      <nav className="mb-8">
        <Link
          href={`/${username}/blog`}
          className="text-xs no-underline transition-colors"
          style={{ color: "var(--text-muted)" }}
        >
          ← back to blog
        </Link>
      </nav>

      <article>
        <header className="mb-10">
          <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--text)" }}>
            {post.title}
          </h1>
          <div className="flex items-center gap-3 text-xs" style={{ color: "var(--text-muted)", opacity: 0.5 }}>
            <time dateTime={post.publishedAt?.toISOString() ?? post.createdAt.toISOString()}>
              {new Date(post.publishedAt ?? post.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
            {viewCount > 0 && <span>· {viewCount} view{viewCount !== 1 ? "s" : ""}</span>}
          </div>
        </header>

        <div className="prose-custom">
          <PostContent source={post.content} />
        </div>
      </article>

      {/* Reactions */}
      <div className="mt-10 pt-8" style={{ borderTop: "1px solid var(--border)" }}>
        <ReactionBar postId={post.id} />
      </div>

      {/* Comments */}
      <div className="mt-10 pt-8" style={{ borderTop: "1px solid var(--border)" }}>
        <CommentsSection postId={post.id} />
      </div>
    </div>
  );
}
