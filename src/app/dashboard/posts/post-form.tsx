"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MDXContent } from "@/components/mdx-content";

interface PostData {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  content: string;
  status: string;
  coverImage: string | null;
  tags: string[] | null;
  publishedAt: string | null;
}

interface PostFormProps {
  mode: "new" | "edit";
  post?: PostData;
  username?: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function PostForm({ mode, post, username }: PostFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [deleting, setDeleting] = useState(false);

  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(mode === "edit");
  const [description, setDescription] = useState(post?.description ?? "");
  const [tags, setTags] = useState((post?.tags ?? []).join(", "));
  const [content, setContent] = useState(post?.content ?? "");
  const [showPreview, setShowPreview] = useState(false);

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newTitle = e.target.value;
      setTitle(newTitle);
      if (!slugManuallyEdited) {
        setSlug(slugify(newTitle));
      }
    },
    [slugManuallyEdited]
  );

  const handleSlugChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSlugManuallyEdited(true);
      setSlug(e.target.value);
    },
    []
  );

  async function handleSubmit(status: "published" | "draft") {
    setSaving(true);
    setMessage("");

    const parsedTags = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const data = {
      title,
      slug,
      description: description || null,
      content,
      status,
      tags: parsedTags,
    };

    try {
      const url =
        mode === "new" ? "/api/posts" : `/api/posts/${post!.id}`;
      const method = mode === "new" ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        setMessage(err.error || "failed to save");
      } else {
        if (mode === "new") {
          const created = await res.json();
          setMessage("created!");
          router.push(`/dashboard/posts/${created.id}/edit`);
        } else {
          setMessage("saved!");
          setTimeout(() => setMessage(""), 2000);
        }
      }
    } catch {
      setMessage("failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!post) return;
    if (!window.confirm("are you sure you want to delete this post? this cannot be undone.")) return;

    setDeleting(true);
    setMessage("");

    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const err = await res.json();
        setMessage(err.error || "failed to delete");
        setDeleting(false);
      } else {
        router.push("/dashboard/posts");
      }
    } catch {
      setMessage("failed to delete");
      setDeleting(false);
    }
  }

  return (
    <div>
      <div className="space-y-4">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>
            title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={handleTitleChange}
            required
            placeholder="my awesome post"
            className="w-full text-sm px-3 py-2.5 rounded-lg outline-none"
            style={{ background: "var(--card-bg)", color: "var(--text)", border: "1px solid var(--border)" }}
          />
        </div>

        {/* Slug */}
        <div>
          <label htmlFor="slug" className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>
            slug
          </label>
          <input
            id="slug"
            type="text"
            value={slug}
            onChange={handleSlugChange}
            required
            placeholder="my-awesome-post"
            className="w-full text-xs px-3 py-2.5 rounded-lg outline-none"
            style={{ background: "var(--card-bg)", color: "var(--text)", border: "1px solid var(--border)" }}
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>
            description
          </label>
          <input
            id="description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="a short description for seo and previews"
            className="w-full text-xs px-3 py-2.5 rounded-lg outline-none"
            style={{ background: "var(--card-bg)", color: "var(--text)", border: "1px solid var(--border)" }}
          />
        </div>

        {/* Tags */}
        <div>
          <label htmlFor="tags" className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>
            tags (comma-separated)
          </label>
          <input
            id="tags"
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="react, nextjs, typescript"
            className="w-full text-xs px-3 py-2.5 rounded-lg outline-none"
            style={{ background: "var(--card-bg)", color: "var(--text)", border: "1px solid var(--border)" }}
          />
        </div>

        {/* Content with preview toggle */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="content" className="text-xs" style={{ color: "var(--text-muted)" }}>
              content (mdx)
            </label>
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="text-xs px-2 py-1 rounded transition-opacity hover:opacity-80"
              style={{
                background: showPreview ? "var(--accent)" : "transparent",
                color: showPreview ? "#fff" : "var(--text-muted)",
                border: showPreview ? "none" : "1px solid var(--border)",
                cursor: "pointer",
              }}
            >
              {showPreview ? "edit" : "preview"}
            </button>
          </div>

          {showPreview ? (
            <div
              className="w-full min-h-[480px] px-4 py-4 rounded-lg overflow-y-auto"
              style={{ background: "var(--card-bg)", border: "1px solid var(--border)" }}
            >
              {content ? (
                <MDXContent source={content} />
              ) : (
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  nothing to preview
                </p>
              )}
            </div>
          ) : (
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={20}
              placeholder={"# Hello world\n\nWrite your post in MDX..."}
              className="w-full text-xs px-3 py-2.5 rounded-lg outline-none resize-y font-mono"
              style={{ background: "var(--card-bg)", color: "var(--text)", border: "1px solid var(--border)" }}
            />
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            disabled={saving || !title || !slug}
            onClick={() => handleSubmit("published")}
            className="text-xs font-medium px-4 py-2 rounded-lg transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: "var(--accent)", color: "#fff", border: "none", cursor: saving ? "not-allowed" : "pointer" }}
          >
            {saving ? "saving..." : "publish"}
          </button>
          <button
            type="button"
            disabled={saving || !title || !slug}
            onClick={() => handleSubmit("draft")}
            className="text-xs font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            style={{ background: "transparent", color: "var(--text-muted)", border: "1px solid var(--border)", cursor: saving ? "not-allowed" : "pointer" }}
          >
            {saving ? "saving..." : "save draft"}
          </button>

          {mode === "edit" && username && post && (
            <a
              href={`/${username}/blog/${post.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium px-4 py-2 rounded-lg transition-opacity hover:opacity-80 no-underline"
              style={{ color: "var(--accent)" }}
            >
              view post ↗
            </a>
          )}

          {mode === "edit" && (
            <button
              type="button"
              disabled={deleting}
              onClick={handleDelete}
              className="text-xs font-medium px-4 py-2 rounded-lg transition-opacity hover:opacity-90 disabled:opacity-50 ml-auto"
              style={{ background: "transparent", color: "#ef4444", border: "1px solid #ef4444", cursor: deleting ? "not-allowed" : "pointer" }}
            >
              {deleting ? "deleting..." : "delete post"}
            </button>
          )}

          {message && (
            <span
              className="text-xs"
              style={{ color: message === "saved!" || message === "created!" ? "#22c55e" : "#ef4444" }}
            >
              {message}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
