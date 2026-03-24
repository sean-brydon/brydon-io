import type { Metadata } from "next";
import Link from "next/link";
import { PostForm } from "../post-form";

export const metadata: Metadata = {
  title: "new post",
};

export default function NewPostPage() {
  return (
    <div>
      <nav className="mb-6">
        <Link
          href="/dashboard/posts"
          className="text-xs no-underline"
          style={{ color: "var(--text-muted)" }}
        >
          ← back to posts
        </Link>
      </nav>

      <h1 className="text-xl font-bold mb-6" style={{ color: "var(--text)" }}>
        new post
      </h1>

      <PostForm mode="new" />
    </div>
  );
}
