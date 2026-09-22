import { ArrowUpRightIcon } from "lucide-react";
import Link from "next/link";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

export type PostLink = { slug: string; title: string; date: string };

const LATEST_POSTS = 3;
const postDate = new Intl.DateTimeFormat("en-GB", {
  month: "short",
  year: "numeric",
});

export function About({
  posts,
  className,
}: {
  posts: PostLink[];
  className?: string;
}) {
  return (
    <aside className={cn("flex flex-col gap-8 text-sm", className)}>
      <header className="flex flex-col gap-3">
        <div>
          <h1 className="font-heading font-semibold text-2xl tracking-tight">
            {site.name}
          </h1>
          <p className="text-base text-muted-foreground">{site.role}</p>
        </div>
        <ul className="flex flex-wrap gap-x-4 gap-y-1">
          {site.links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="group inline-flex items-center gap-0.5 underline decoration-foreground/20 underline-offset-4 transition-colors hover:decoration-foreground/60"
              >
                {link.label}
                <ArrowUpRightIcon className="size-3.5 opacity-50 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
            </li>
          ))}
        </ul>
      </header>

      <div className="flex flex-col gap-3 text-pretty text-foreground/80 leading-relaxed">
        {site.bio.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>

      <Section title="Work">
        {site.work.map((job) => (
          <Row key={job.href} href={job.href} external meta={job.meta}>
            <span className="font-medium">{job.name}</span>
            <span className="text-muted-foreground"> · {job.description}</span>
          </Row>
        ))}
      </Section>

      {posts.length > 0 && (
        <Section title="Writing">
          {posts.slice(0, LATEST_POSTS).map((post) => (
            <Row
              key={post.slug}
              href={`/blog/${post.slug}`}
              meta={postDate.format(new Date(post.date))}
            >
              {post.title}
            </Row>
          ))}
          {posts.length > LATEST_POSTS && (
            <Row href="/blog">
              <span className="text-muted-foreground">All writing →</span>
            </Row>
          )}
        </Section>
      )}

      <p className="mt-auto text-muted-foreground text-xs">
        Built with Next.js, Convex, and far too many box-shadows.
      </p>
    </aside>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-1">
      <h2 className="mb-1 font-medium text-muted-foreground">{title}</h2>
      <ul className="-mx-2.5 flex flex-col">{children}</ul>
    </section>
  );
}

function Row({
  href,
  external,
  meta,
  children,
}: {
  href: string;
  external?: boolean;
  meta?: string;
  children: React.ReactNode;
}) {
  const className =
    "flex items-baseline gap-4 rounded-lg px-2.5 py-1.5 transition-colors hover:bg-accent";
  const content = (
    <>
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {meta && <span className="shrink-0 text-muted-foreground">{meta}</span>}
    </>
  );
  return (
    <li>
      {external ? (
        <a href={href} target="_blank" rel="noreferrer" className={className}>
          {content}
        </a>
      ) : (
        <Link href={href} className={className}>
          {content}
        </Link>
      )}
    </li>
  );
}
