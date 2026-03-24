import type { ReactNode } from "react";
import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { ThemeToggle } from "@/components/theme-toggle";

// ─── Sidebar Navigation ────────────────────────────────────────────────────────
const sidebarLinks = [
  { href: "/dashboard", label: "overview", icon: "◻" },
  { href: "/dashboard/posts", label: "posts", icon: "✎" },
  { href: "/dashboard/projects", label: "projects", icon: "◆" },
  { href: "/dashboard/experience", label: "experience", icon: "◉" },
  { href: "/dashboard/profile", label: "profile", icon: "◈" },
  { href: "/dashboard/settings", label: "settings", icon: "⚙" },
];

const companyLinks = [
  { href: "/dashboard/company", label: "company", icon: "◎" },
  { href: "/dashboard/company/jobs", label: "jobs", icon: "◇" },
  { href: "/dashboard/company/applicants", label: "applicants", icon: "◈" },
  { href: "/dashboard/company/billing", label: "billing", icon: "◆" },
];

// ─── Main Dashboard Layout (with sidebar) ──────────────────────────────────────
// This layout renders the sidebar chrome for all standard dashboard pages.
// Editor pages live in the sibling (editor) route group and bypass this sidebar.
export default async function MainDashboardLayout({ children }: { children: ReactNode }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Parent layout already redirects if no session, but we need the user data here
  const user = session!.user;

  // Build display name: prefer name, then username, fall back to email
  const displayName = user.name || (user as Record<string, unknown>).username as string || user.email;
  // First letter for the avatar fallback
  const avatarInitial = (displayName ?? "?")[0]?.toUpperCase();

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside
        className="w-56 shrink-0 border-r flex flex-col"
        style={{ borderColor: "var(--border)", background: "var(--card-bg)" }}
      >
        <div className="px-4 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="text-sm font-semibold no-underline"
            style={{ color: "var(--text)" }}
          >
            brydon.io
          </Link>
          <ThemeToggle />
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1">
          {sidebarLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-2.5 px-3 py-2 rounded-md text-xs no-underline transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.03]"
              style={{ color: "var(--text-muted)" }}
            >
              <span className="text-[10px] opacity-50">{link.icon}</span>
              {link.label}
            </Link>
          ))}

          <div className="my-3 mx-3 border-t" style={{ borderColor: "var(--border)" }} />

          {companyLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-2.5 px-3 py-2 rounded-md text-xs no-underline transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.03]"
              style={{ color: "var(--text-muted)" }}
            >
              <span className="text-[10px] opacity-50">{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Authenticated user info */}
        <div className="px-4 py-4 border-t" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2">
            {user.image ? (
              <img
                src={user.image}
                alt={displayName ?? "User avatar"}
                className="w-6 h-6 rounded-full object-cover"
              />
            ) : (
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                style={{ background: "var(--accent)", color: "#fff" }}
              >
                {avatarInitial}
              </div>
            )}
            <span
              className="text-xs truncate max-w-[140px]"
              style={{ color: "var(--text-muted)" }}
              title={user.email}
            >
              {displayName}
            </span>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
