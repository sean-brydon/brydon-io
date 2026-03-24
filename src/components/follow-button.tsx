"use client";

import { useState, useCallback } from "react";
import { useSession } from "@/lib/auth-client";

interface FollowButtonProps {
  userId: string;
  initialFollowing: boolean;
  followerCount: number;
}

export function FollowButton({
  userId,
  initialFollowing,
  followerCount: initialCount,
}: FollowButtonProps) {
  const { data: session } = useSession();
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [count, setCount] = useState(initialCount);
  const [hovering, setHovering] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleClick = useCallback(async () => {
    if (loading) return;

    // Optimistic update
    const wasFollowing = isFollowing;
    const prevCount = count;
    setIsFollowing(!wasFollowing);
    setCount((c) => (wasFollowing ? c - 1 : c + 1));
    setLoading(true);

    try {
      const res = await fetch(`/api/follow/${userId}`, {
        method: wasFollowing ? "DELETE" : "POST",
        credentials: "include",
      });

      if (!res.ok) {
        // Revert on failure
        setIsFollowing(wasFollowing);
        setCount(prevCount);
      }
    } catch {
      // Revert on error
      setIsFollowing(wasFollowing);
      setCount(prevCount);
    } finally {
      setLoading(false);
    }
  }, [isFollowing, count, loading, userId]);

  // Don't render if viewing your own profile
  if (session?.user?.id === userId) return null;

  // Not logged in — show static count only
  if (!session?.user) {
    return (
      <span
        className="text-xs"
        style={{ color: "var(--text-muted)" }}
      >
        {count} {count === 1 ? "follower" : "followers"}
      </span>
    );
  }

  const label = isFollowing
    ? hovering
      ? "unfollow"
      : "following"
    : "follow";

  const isUnfollow = isFollowing && hovering;

  return (
    <span className="inline-flex items-center gap-2">
      <button
        onClick={handleClick}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        disabled={loading}
        className="text-xs no-underline px-3 py-1 rounded-md transition-colors cursor-pointer disabled:opacity-50"
        style={
          isUnfollow
            ? {
                background: "transparent",
                color: "#e54545",
                border: "1px solid #e54545",
              }
            : isFollowing
              ? {
                  background: "transparent",
                  color: "var(--text-muted)",
                  border: "1px solid var(--border)",
                }
              : {
                  background: "var(--accent)",
                  color: "#fff",
                  border: "1px solid var(--accent)",
                }
        }
      >
        {label}
      </button>
      <span
        className="text-xs"
        style={{ color: "var(--text-muted)" }}
      >
        {count} {count === 1 ? "follower" : "followers"}
      </span>
    </span>
  );
}
