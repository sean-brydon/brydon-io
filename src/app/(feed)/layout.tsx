import type { ReactNode } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export default function FeedLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header
        className="sticky top-0 z-40 backdrop-blur-md"
        style={{ background: "color-mix(in srgb, var(--bg) 80%, transparent)" }}
      >
        <nav className="max-w-[640px] mx-auto px-5 h-14 flex items-center justify-between">
          <Link href="/" className="text-sm font-semibold no-underline" style={{ color: "var(--text)" }}>
            devl.dev
          </Link>
          <div className="flex items-center gap-5">
            <Link href="/feed" className="text-xs no-underline" style={{ color: "var(--accent)" }}>
              feed
            </Link>
            <Link href="/dashboard" className="text-xs no-underline" style={{ color: "var(--text-muted)" }}>
              dashboard
            </Link>
            <ThemeToggle />
          </div>
        </nav>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
