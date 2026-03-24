"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface FeedPost {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  publishedAt: string | null;
  tags: string[] | null;
  authorName: string;
  authorUsername: string | null;
  authorImage: string | null;
}

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function FeedList() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  async function fetchFeed(cursorParam?: string) {
    const url = cursorParam ? `/api/feed?cursor=${cursorParam}` : "/api/feed";
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) return { posts: [], nextCursor: null };
    return res.json();
  }

  useEffect(() => {
    fetchFeed().then((data) => {
      setPosts(data.posts ?? []);
      setCursor(data.nextCursor);
      setHasMore(!!data.nextCursor);
      setLoading(false);
    });
  }, []);

  async function loadMore() {
    if (!cursor) return;
    setLoadingMore(true);
    const data = await fetchFeed(cursor);
    setPosts((prev) => [...prev, ...(data.posts ?? [])]);
    setCursor(data.nextCursor);
    setHasMore(!!data.nextCursor);
    setLoadingMore(false);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse p-4 rounded-lg" style={{ background: "var(--card-bg)" }}>
            <div className="h-3 rounded w-1/3 mb-3" style={{ background: "var(--border)" }} />
            <div className="h-4 rounded w-2/3 mb-2" style={{ background: "var(--border)" }} />
            <div className="h-3 rounded w-full" style={{ background: "var(--border)" }} />
          </div>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-20 rounded-lg" style={{ border: "1px dashed var(--border)" }}>
        <p className="text-sm mb-2" style={{ color: "var(--text-muted)" }}>
          your feed is empty
        </p>
        <p className="text-xs" style={{ color: "var(--text-muted)", opacity: 0.6 }}>
          follow some developers to see their posts here.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-0">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/${post.authorUsername}/blog/${post.slug}`}
            className="block no-underline py-4 -mx-4 px-4 rounded-lg transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
          >
            {/* Author */}
            <div className="flex items-center gap-2 mb-2">
              {post.authorImage ? (
                <img src={post.authorImage} alt="" className="w-5 h-5 rounded-full" />
              ) : (
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold" style={{ background: "var(--accent)", color: "#fff" }}>
                  {post.authorName?.[0]?.toUpperCase()}
                </div>
              )}
              <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                {post.authorName}
                {post.authorUsername && (
                  <span style={{ opacity: 0.5 }}> @{post.authorUsername}</span>
                )}
              </span>
              {post.publishedAt && (
                <span className="text-[10px]" style={{ color: "var(--text-muted)", opacity: 0.4 }}>
                  · {timeAgo(post.publishedAt)}
                </span>
              )}
            </div>

            {/* Content */}
            <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--text)" }}>
              {post.title}
            </h3>
            {post.description && (
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                {post.description}
              </p>
            )}

            {/* Tags */}
            {post.tags && (post.tags as string[]).length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {(post.tags as string[]).slice(0, 4).map((tag) => (
                  <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: "var(--card-bg)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </Link>
        ))}
      </div>

      {hasMore && (
        <div className="text-center mt-8">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="text-xs px-4 py-2 rounded-lg transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{ color: "var(--accent)", background: "none", border: "1px solid var(--border)", cursor: loadingMore ? "not-allowed" : "pointer" }}
          >
            {loadingMore ? "loading..." : "load more"}
          </button>
        </div>
      )}
    </div>
  );
}
