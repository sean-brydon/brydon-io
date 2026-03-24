"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./theme-toggle";
import { NotificationBell } from "./notification-bell";
import type { UserProfile } from "@/app/[username]/layout";

interface UserNavProps {
  user: UserProfile;
}

export function UserNav({ user }: UserNavProps) {
  const pathname = usePathname();
  const base = `/${user.username}`;

  const links = [
    { href: `${base}/work`, label: "work" },
    { href: `${base}/blog`, label: "blog" },
    ...(user.githubUsername
      ? [{ href: `https://github.com/${user.githubUsername}`, label: "github", external: true }]
      : []),
  ];

  return (
    <header
      className="sticky top-0 z-40 backdrop-blur-md"
      style={{ background: "color-mix(in srgb, var(--bg) 80%, transparent)" }}
    >
      <nav className="max-w-[640px] mx-auto px-5 h-14 flex items-center justify-between">
        <Link
          href={base}
          className="text-sm font-semibold no-underline transition-colors"
          style={{ color: "var(--text)" }}
        >
          {user.displayName}
        </Link>

        <div className="flex items-center gap-5">
          {links.map((link) => {
            const isExternal = "external" in link && link.external;
            const isActive = !isExternal && pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
                className="text-xs no-underline transition-colors"
                style={{
                  color: isActive ? "var(--accent)" : "var(--text-muted)",
                }}
              >
                {link.label}
                {isExternal && (
                  <span className="ml-0.5 opacity-40">↗</span>
                )}
              </Link>
            );
          })}
          <NotificationBell />
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
