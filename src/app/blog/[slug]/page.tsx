import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ slug: string }>;
}

/**
 * Legacy route — redirects to the default user's blog post.
 * TODO: Remove once all old links have been updated.
 */
export default async function LegacyBlogPostPage({ params }: Props) {
  const { slug } = await params;
  redirect(`/sean/blog/${slug}`);
}
