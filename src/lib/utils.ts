// ─── Shared Utility Functions ───────────────────────────────────────────────────
// Used by CommentsSection, NotificationBell, feed cards, and other components.

// ─── Relative Time Formatting ───────────────────────────────────────────────────

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

/**
 * Format a date as a human-readable relative time string.
 *
 * Examples: "just now", "2m ago", "5h ago", "3d ago", "2w ago", "4mo ago", "1y ago"
 *
 * @param date - A `Date` object or ISO 8601 string
 * @returns Relative time string (e.g. "3d ago")
 */
export function timeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = Date.now();
  const diff = Math.max(0, Math.floor((now - d.getTime()) / 1000)); // seconds

  if (diff < MINUTE) return "just now";
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}m ago`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h ago`;
  if (diff < WEEK) return `${Math.floor(diff / DAY)}d ago`;
  if (diff < MONTH) return `${Math.floor(diff / WEEK)}w ago`;
  if (diff < YEAR) return `${Math.floor(diff / MONTH)}mo ago`;
  return `${Math.floor(diff / YEAR)}y ago`;
}

// ─── Avatar Helpers ─────────────────────────────────────────────────────────────

/**
 * Extract the initial character(s) for an avatar fallback.
 *
 * Priority: `name` → `username` → `email` → "?"
 *
 * @returns Uppercase initial string (1-2 chars)
 */
export function getAvatarInitial(user: {
  name?: string | null;
  username?: string | null;
  email?: string | null;
}): string {
  const source = user.name || user.username || user.email || "?";
  // For multi-word names, take first letter of first two words ("Sean B" → "SB")
  const parts = source.trim().split(/\s+/);
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return (parts[0][0]! + parts[1][0]!).toUpperCase();
  }
  return (source[0] ?? "?").toUpperCase();
}

/**
 * Build a display name from a user record.
 *
 * Priority: `name` → `displayUsername` → `username` → `email`
 */
export function getDisplayName(user: {
  name?: string | null;
  displayUsername?: string | null;
  username?: string | null;
  email?: string | null;
}): string {
  return user.name || user.displayUsername || user.username || user.email || "Anonymous";
}

// ─── Misc ───────────────────────────────────────────────────────────────────────

/**
 * Pluralise a word based on count.
 * `pluralise(3, "comment")` → "3 comments"
 * `pluralise(1, "reply", "replies")` → "1 reply"
 */
export function pluralise(count: number, singular: string, plural?: string): string {
  const word = count === 1 ? singular : (plural ?? `${singular}s`);
  return `${count} ${word}`;
}

/**
 * Clamp a number between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
