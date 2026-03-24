"use client";

import { useEffect, useState, useCallback } from "react";

const REACTIONS = [
  { type: "like", emoji: "👍" },
  { type: "love", emoji: "❤️" },
  { type: "fire", emoji: "🔥" },
  { type: "clap", emoji: "👏" },
  { type: "insightful", emoji: "💡" },
] as const;

type ReactionType = (typeof REACTIONS)[number]["type"];

interface ReactionState {
  counts: Record<string, number>;
  userReactions: string[];
}

interface ReactionBarProps {
  postId: string;
}

export function ReactionBar({ postId }: ReactionBarProps) {
  const [state, setState] = useState<ReactionState>({
    counts: {},
    userReactions: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/reactions/posts/${postId}`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: ReactionState) => {
        if (!cancelled) {
          setState(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [postId]);

  const toggle = useCallback(
    async (type: ReactionType) => {
      const wasReacted = state.userReactions.includes(type);

      // Optimistic update
      setState((prev) => {
        const nextUserReactions = wasReacted
          ? prev.userReactions.filter((r) => r !== type)
          : [...prev.userReactions, type];

        const nextCounts = { ...prev.counts };
        const current = nextCounts[type] ?? 0;
        nextCounts[type] = wasReacted
          ? Math.max(0, current - 1)
          : current + 1;

        return { counts: nextCounts, userReactions: nextUserReactions };
      });

      try {
        const res = await fetch(`/api/reactions/posts/${postId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type }),
          credentials: "include",
        });

        if (!res.ok) {
          // Revert on failure
          setState((prev) => {
            const revertedUserReactions = wasReacted
              ? [...prev.userReactions, type]
              : prev.userReactions.filter((r) => r !== type);

            const revertedCounts = { ...prev.counts };
            const current = revertedCounts[type] ?? 0;
            revertedCounts[type] = wasReacted
              ? current + 1
              : Math.max(0, current - 1);

            return {
              counts: revertedCounts,
              userReactions: revertedUserReactions,
            };
          });
        }
      } catch {
        // Revert on network error
        setState((prev) => {
          const revertedUserReactions = wasReacted
            ? [...prev.userReactions, type]
            : prev.userReactions.filter((r) => r !== type);

          const revertedCounts = { ...prev.counts };
          const current = revertedCounts[type] ?? 0;
          revertedCounts[type] = wasReacted
            ? current + 1
            : Math.max(0, current - 1);

          return {
            counts: revertedCounts,
            userReactions: revertedUserReactions,
          };
        });
      }
    },
    [postId, state.userReactions],
  );

  if (loading) {
    return (
      <div className="flex items-center gap-2 mt-8">
        {REACTIONS.map(({ type, emoji }) => (
          <div
            key={type}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs"
            style={{
              border: "1px solid var(--border)",
              background: "var(--card-bg)",
              color: "var(--text-muted)",
              opacity: 0.5,
            }}
          >
            <span>{emoji}</span>
            <span>0</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap mt-8">
      {REACTIONS.map(({ type, emoji }) => {
        const count = state.counts[type] ?? 0;
        const isActive = state.userReactions.includes(type);

        return (
          <button
            key={type}
            onClick={() => toggle(type)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all"
            style={{
              border: isActive
                ? "1px solid var(--accent)"
                : "1px solid var(--border)",
              background: isActive
                ? "color-mix(in srgb, var(--accent) 10%, var(--card-bg))"
                : "var(--card-bg)",
              color: isActive ? "var(--accent)" : "var(--text-muted)",
              cursor: "pointer",
            }}
            title={type}
            aria-label={`${type} reaction${count > 0 ? `, ${count}` : ""}`}
            aria-pressed={isActive}
          >
            <span>{emoji}</span>
            {count > 0 && <span>{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
