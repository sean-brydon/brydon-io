"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "@/lib/auth-client";

// ─── Types ──────────────────────────────────────────────────────────

interface Notification {
  id: string;
  type: "follow" | "reaction" | "comment" | "reply";
  resourceId: string | null;
  read: boolean;
  createdAt: string;
  actorId: string;
  actorName: string | null;
  actorUsername: string | null;
  actorImage: string | null;
}

interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

// ─── Helpers ────────────────────────────────────────────────────────

const ACTION_TEXT: Record<Notification["type"], string> = {
  follow: "followed you",
  reaction: "reacted to your post",
  comment: "commented on your post",
  reply: "replied to your comment",
};

function timeAgo(dateStr: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000,
  );
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

// ─── Component ──────────────────────────────────────────────────────

const POLL_INTERVAL = 30_000; // 30 seconds

export function NotificationBell() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Fetch notifications ─────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?limit=20&offset=0", {
        credentials: "include",
      });
      if (!res.ok) return;
      const data: NotificationsResponse = await res.json();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      // silently fail — non-critical
    }
  }, []);

  // ── Poll every 30s when authenticated ───────────────────────────
  useEffect(() => {
    if (!session?.user) return;

    fetchNotifications();
    const interval = setInterval(fetchNotifications, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [session?.user, fetchNotifications]);

  // ── Close on click outside ──────────────────────────────────────
  useEffect(() => {
    if (!open) return;

    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }

    // Use capture phase so it fires before other handlers
    document.addEventListener("mousedown", handleClick, true);
    return () => document.removeEventListener("mousedown", handleClick, true);
  }, [open]);

  // ── Close on Escape key ─────────────────────────────────────────
  useEffect(() => {
    if (!open) return;

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  // ── Mark all as read ────────────────────────────────────────────
  async function markAllRead() {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications/read", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, read: true })),
        );
        setUnreadCount(0);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  // Don't render unless authenticated
  if (!session?.user) return null;

  return (
    <div ref={containerRef} className="relative">
      {/* ── Bell button ──────────────────────────────────────────── */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="w-7 h-7 flex items-center justify-center rounded-md transition-colors relative"
        style={{
          color: "var(--text-muted)",
          background: "var(--card-bg)",
        }}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>

        {/* ── Unread badge ───────────────────────────────────────── */}
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[16px] h-4 flex items-center justify-center rounded-full text-white text-[10px] font-bold leading-none px-1"
            style={{ background: "#ef4444" }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* ── Dropdown ─────────────────────────────────────────────── */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-80 rounded-lg overflow-hidden shadow-lg z-50"
          style={{
            background: "var(--card-bg)",
            border: "1px solid var(--border)",
            backdropFilter: "blur(12px)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <span
              className="text-xs font-semibold"
              style={{ color: "var(--text)" }}
            >
              Notifications
            </span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                disabled={loading}
                className="text-[10px] transition-colors cursor-pointer disabled:opacity-50"
                style={{ color: "var(--accent)" }}
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div
                className="px-4 py-8 text-center text-xs"
                style={{ color: "var(--text-muted)" }}
              >
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className="flex items-start gap-3 px-4 py-3 transition-colors"
                  style={{
                    borderBottom: "1px solid var(--border)",
                    background: n.read ? "transparent" : "var(--code-bg)",
                  }}
                >
                  {/* Actor avatar */}
                  {n.actorImage ? (
                    <img
                      src={n.actorImage}
                      alt={n.actorName ?? n.actorUsername ?? "User"}
                      className="w-7 h-7 rounded-full flex-shrink-0 object-cover"
                    />
                  ) : (
                    <div
                      className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold"
                      style={{
                        background: "var(--border)",
                        color: "var(--text-muted)",
                      }}
                    >
                      {(n.actorName ?? n.actorUsername ?? "?")[0]?.toUpperCase()}
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-xs leading-relaxed"
                      style={{ color: "var(--text)" }}
                    >
                      <span className="font-semibold">
                        {n.actorName ?? n.actorUsername ?? "Someone"}
                      </span>{" "}
                      <span style={{ color: "var(--text-muted)" }}>
                        {ACTION_TEXT[n.type]}
                      </span>
                    </p>
                    <span
                      className="text-[10px]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {timeAgo(n.createdAt)}
                    </span>
                  </div>

                  {/* Unread dot */}
                  {!n.read && (
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                      style={{ background: "var(--accent)" }}
                    />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
