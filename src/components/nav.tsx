"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./theme-toggle";

const links = [
  { href: "/work", label: "work" },
  { href: "/blog", label: "blog" },
  { href: "https://github.com/sean-brydon", label: "github", external: true },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md" style={{ background: "color-mix(in srgb, var(--bg) 80%, transparent)" }}>
      <nav className="max-w-[640px] mx-auto px-5 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="text-sm font-semibold no-underline transition-colors"
          style={{ color: "var(--text)" }}
        >
          sean brydon
        </Link>

        <div className="flex items-center gap-5">
          {links.map((link) => {
            const isActive = !link.external && pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                target={link.external ? "_blank" : undefined}
                rel={link.external ? "noopener noreferrer" : undefined}
                className="text-xs no-underline transition-colors"
                style={{
                  color: isActive ? "var(--accent)" : "var(--text-muted)",
                }}
              >
                {link.label}
                {link.external && (
                  <span className="ml-0.5 opacity-40">↗</span>
                )}
              </Link>
            );
          })}
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
