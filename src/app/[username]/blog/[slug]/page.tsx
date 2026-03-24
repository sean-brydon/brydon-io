import { notFound } from "next/navigation";
import Link from "next/link";
import { MDXContent } from "@/components/mdx-content";
import { db } from "@/db";
import { posts, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";

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

  return (
    <div className="max-w-[640px] mx-auto px-5 py-12">
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
          </div>
        </header>

        <div className="prose-custom">
          <MDXContent source={post.content} />
        </div>
      </article>
    </div>
  );
}
