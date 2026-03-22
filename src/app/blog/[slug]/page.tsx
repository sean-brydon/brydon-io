import { notFound } from "next/navigation";
import Link from "next/link";
import { getBlogPost, getAllBlogSlugs } from "@/lib/mdx";
import { MDXContent } from "@/components/mdx-content";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllBlogSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) notFound();

  return (
    <div className="max-w-[640px] mx-auto px-5 py-12">
      <nav className="mb-8">
        <Link
          href="/blog"
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
            <time dateTime={post.date}>
              {new Date(post.date).toLocaleDateString("en-US", {
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
