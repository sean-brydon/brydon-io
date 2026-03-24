"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "@/lib/auth-client";

// ─── Types ───────────────────────────────────────────────────────────

interface CommentUser {
  id: string;
  name: string;
  username: string | null;
  image: string | null;
}

interface Comment {
  id: string;
  userId: string;
  postId: string;
  parentId: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: CommentUser;
  replies?: Comment[];
}

interface CommentsResponse {
  comments: Comment[];
  total: number;
}

interface CommentsSectionProps {
  postId: string;
}

// ─── Time-ago helper ─────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;

  const years = Math.floor(months / 12);
  return `${years}y ago`;
}

// ─── Avatar ──────────────────────────────────────────────────────────

function Avatar({ user, size = 28 }: { user: CommentUser; size?: number }) {
  const initials = (user.name || user.username || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (user.image) {
    return (
      <img
        src={user.image}
        alt=""
        width={size}
        height={size}
        className="rounded-full shrink-0"
        style={{ width: size, height: size, objectFit: "cover" }}
      />
    );
  }

  return (
    <div
      className="rounded-full shrink-0 flex items-center justify-center text-[10px] font-semibold select-none"
      style={{
        width: size,
        height: size,
        background: "var(--border)",
        color: "var(--text-muted)",
      }}
    >
      {initials}
    </div>
  );
}

// ─── Single Comment ──────────────────────────────────────────────────

function CommentItem({
  comment,
  currentUserId,
  isReply = false,
  onReply,
  onDelete,
}: {
  comment: Comment;
  currentUserId: string | null;
  isReply?: boolean;
  onReply?: (parentId: string) => void;
  onDelete: (commentId: string) => void;
}) {
  const isOwn = currentUserId === comment.userId;

  return (
    <div
      className="flex gap-3"
      style={{ paddingLeft: isReply ? 40 : 0 }}
    >
      <Avatar user={comment.user} size={isReply ? 24 : 28} />

      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-xs font-semibold"
            style={{ color: "var(--text)" }}
          >
            {comment.user.name}
          </span>
          {comment.user.username && (
            <span
              className="text-[11px]"
              style={{ color: "var(--text-muted)", opacity: 0.6 }}
            >
              @{comment.user.username}
            </span>
          )}
          <span
            className="text-[11px]"
            style={{ color: "var(--text-muted)", opacity: 0.4 }}
          >
            {timeAgo(comment.createdAt)}
          </span>
        </div>

        {/* Content */}
        <p
          className="text-sm mt-1 mb-0 whitespace-pre-wrap break-words"
          style={{ color: "var(--text)", lineHeight: 1.6 }}
        >
          {comment.content}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-3 mt-1.5">
          {/* Reply button — top-level only */}
          {!isReply && onReply && (
            <button
              onClick={() => onReply(comment.id)}
              className="text-[11px] transition-colors cursor-pointer bg-transparent border-none p-0"
              style={{ color: "var(--text-muted)" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "var(--accent)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--text-muted)")
              }
            >
              reply
            </button>
          )}

          {/* Delete button — own comments only */}
          {isOwn && (
            <button
              onClick={() => onDelete(comment.id)}
              className="text-[11px] transition-colors cursor-pointer bg-transparent border-none p-0"
              style={{ color: "var(--text-muted)" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "#e54545")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--text-muted)")
              }
              title="Delete comment"
            >
              ×
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Comment Form ────────────────────────────────────────────────────

function CommentForm({
  onSubmit,
  replyingTo,
  onCancelReply,
}: {
  onSubmit: (content: string, parentId?: string) => Promise<void>;
  replyingTo: { id: string; name: string } | null;
  onCancelReply: () => void;
}) {
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || submitting) return;

    setSubmitting(true);
    try {
      await onSubmit(content.trim(), replyingTo?.id);
      setContent("");
      onCancelReply();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {replyingTo && (
        <div
          className="flex items-center gap-2 mb-2 text-[11px]"
          style={{ color: "var(--text-muted)" }}
        >
          <span>
            replying to{" "}
            <span style={{ color: "var(--accent)" }}>
              {replyingTo.name}
            </span>
          </span>
          <button
            type="button"
            onClick={onCancelReply}
            className="bg-transparent border-none cursor-pointer p-0 text-[11px]"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "#e54545")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--text-muted)")
            }
          >
            ×
          </button>
        </div>
      )}

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={
          replyingTo ? `Reply to ${replyingTo.name}…` : "Write a comment…"
        }
        rows={3}
        className="w-full resize-none text-sm p-3 rounded-md outline-none transition-colors"
        style={{
          background: "var(--card-bg)",
          border: "1px solid var(--border)",
          color: "var(--text)",
          fontFamily: "inherit",
          lineHeight: 1.6,
        }}
        onFocus={(e) =>
          (e.currentTarget.style.borderColor = "var(--accent)")
        }
        onBlur={(e) =>
          (e.currentTarget.style.borderColor = "var(--border)")
        }
      />

      <div className="flex justify-end mt-2">
        <button
          type="submit"
          disabled={!content.trim() || submitting}
          className="text-xs px-4 py-1.5 rounded-md transition-colors cursor-pointer border-none disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: "var(--accent)",
            color: "#fff",
          }}
        >
          {submitting
            ? "posting…"
            : replyingTo
              ? "reply"
              : "comment"}
        </button>
      </div>
    </form>
  );
}

// ─── Main Component ──────────────────────────────────────────────────

export function CommentsSection({ postId }: CommentsSectionProps) {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id ?? null;

  const [comments, setComments] = useState<Comment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // ── Fetch comments ────────────────────────────────────────────────

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/comments/posts/${postId}`);
      if (!res.ok) throw new Error("Failed to load comments");
      const data: CommentsResponse = await res.json();
      setComments(data.comments);
      setTotal(data.total);
      setError(null);
    } catch {
      setError("Could not load comments");
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // ── Post a comment ────────────────────────────────────────────────

  const handleSubmit = useCallback(
    async (content: string, parentId?: string) => {
      const res = await fetch(`/api/comments/posts/${postId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content, parentId }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to post comment");
      }

      // Re-fetch to get proper nesting from server
      await fetchComments();
    },
    [postId, fetchComments],
  );

  // ── Delete a comment ──────────────────────────────────────────────

  const handleDelete = useCallback(
    async (commentId: string) => {
      // Optimistic: remove from state
      setComments((prev) =>
        prev
          .filter((c) => c.id !== commentId)
          .map((c) => ({
            ...c,
            replies: c.replies?.filter((r) => r.id !== commentId),
          })),
      );
      setTotal((t) => Math.max(0, t - 1));

      try {
        const res = await fetch(`/api/comments/${commentId}`, {
          method: "DELETE",
          credentials: "include",
        });

        if (!res.ok) {
          // Revert on failure
          await fetchComments();
        }
      } catch {
        await fetchComments();
      }
    },
    [fetchComments],
  );

  // ── Reply handler ─────────────────────────────────────────────────

  const handleReply = useCallback(
    (parentId: string) => {
      const parent = comments.find((c) => c.id === parentId);
      if (parent) {
        setReplyingTo({ id: parent.id, name: parent.user.name });
      }
    },
    [comments],
  );

  // ── Render ────────────────────────────────────────────────────────

  return (
    <section className="mt-12">
      {/* Section Header */}
      <div
        className="flex items-center gap-2 mb-6"
        style={{ color: "var(--text)" }}
      >
        <h2 className="text-sm font-semibold m-0">Comments</h2>
        {total > 0 && (
          <span
            className="text-[11px]"
            style={{ color: "var(--text-muted)" }}
          >
            ({total})
          </span>
        )}
      </div>

      {/* Comment Form — show only if logged in */}
      {session?.user ? (
        <div className="mb-8">
          <CommentForm
            onSubmit={handleSubmit}
            replyingTo={replyingTo}
            onCancelReply={() => setReplyingTo(null)}
          />
        </div>
      ) : (
        <p
          className="text-xs mb-8"
          style={{ color: "var(--text-muted)" }}
        >
          Sign in to leave a comment.
        </p>
      )}

      {/* Loading State */}
      {loading && (
        <div
          className="text-xs py-8 text-center"
          style={{ color: "var(--text-muted)", opacity: 0.5 }}
        >
          loading comments…
        </div>
      )}

      {/* Error State */}
      {error && (
        <div
          className="text-xs py-4 text-center"
          style={{ color: "#e54545" }}
        >
          {error}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && comments.length === 0 && (
        <div
          className="text-xs py-8 text-center"
          style={{ color: "var(--text-muted)", opacity: 0.5 }}
        >
          No comments yet. Be the first.
        </div>
      )}

      {/* Comment Thread */}
      {!loading && comments.length > 0 && (
        <div className="flex flex-col gap-6">
          {comments.map((comment) => (
            <div key={comment.id}>
              {/* Top-level comment */}
              <CommentItem
                comment={comment}
                currentUserId={currentUserId}
                onReply={session?.user ? handleReply : undefined}
                onDelete={handleDelete}
              />

              {/* Replies (1 level deep) */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="flex flex-col gap-4 mt-4">
                  {comment.replies.map((reply) => (
                    <CommentItem
                      key={reply.id}
                      comment={reply}
                      currentUserId={currentUserId}
                      isReply
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
