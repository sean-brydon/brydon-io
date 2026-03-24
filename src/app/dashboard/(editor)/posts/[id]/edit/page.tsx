import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { posts, users } from "@/db/schema";
import { PostEditor } from "../../post-editor";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `edit post ${id}`,
  };
}

export default async function EditPostPage({ params }: Props) {
  const { id } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const post = await db.query.posts.findFirst({
    where: and(eq(posts.id, id), eq(posts.userId, session.user.id)),
  });

  if (!post) notFound();

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { username: true },
  });

  const postData = {
    id: post.id,
    slug: post.slug,
    title: post.title,
    description: post.description,
    content: post.content,
    status: post.status,
    coverImage: post.coverImage,
    tags: post.tags,
    publishedAt: post.publishedAt?.toISOString() ?? null,
  };

  return (
    <PostEditor
      mode="edit"
      post={postData}
      username={user?.username ?? undefined}
    />
  );
}
