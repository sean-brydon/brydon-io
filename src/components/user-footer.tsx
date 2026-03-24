import type { UserProfile } from "@/app/[username]/layout";

interface UserFooterProps {
  user: UserProfile;
}

export function UserFooter({ user }: UserFooterProps) {
  return (
    <footer className="max-w-[640px] mx-auto px-5 py-12">
      <div
        className="flex items-center justify-between text-xs gap-4 flex-wrap"
        style={{ color: "var(--text-muted)", opacity: 0.5 }}
      >
        <span>© {new Date().getFullYear()} {user.displayName}</span>
        <div className="flex gap-4">
          {user.githubUsername && (
            <a
              href={`https://github.com/${user.githubUsername}`}
              target="_blank"
              rel="noopener noreferrer"
              className="no-underline hover:opacity-80 transition-opacity"
              style={{ color: "var(--text-muted)" }}
            >
              github
            </a>
          )}
          {user.twitterHandle && (
            <a
              href={`https://x.com/${user.twitterHandle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="no-underline hover:opacity-80 transition-opacity"
              style={{ color: "var(--text-muted)" }}
            >
              x/twitter
            </a>
          )}
        </div>
      </div>
    </footer>
  );
}
