import type { ReactNode } from "react";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Marketing header */}
      <header className="sticky top-0 z-40 backdrop-blur-md" style={{ background: "color-mix(in srgb, var(--bg) 80%, transparent)" }}>
        <nav className="max-w-[640px] mx-auto px-5 h-14 flex items-center justify-between">
          <a
            href="/"
            className="text-sm font-semibold no-underline transition-colors"
            style={{ color: "var(--text)" }}
          >
            brydon.io
          </a>
          <div className="flex items-center gap-5">
            <a
              href="/sign-in"
              className="text-xs no-underline transition-colors"
              style={{ color: "var(--text-muted)" }}
            >
              sign in
            </a>
            <a
              href="/sign-up"
              className="text-xs no-underline px-3 py-1.5 rounded-md transition-colors"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              get started
            </a>
          </div>
        </nav>
      </header>

      <main className="flex-1">{children}</main>

      {/* Marketing footer */}
      <footer className="max-w-[640px] mx-auto px-5 py-12">
        <div
          className="flex items-center justify-between text-xs gap-4 flex-wrap"
          style={{ color: "var(--text-muted)", opacity: 0.5 }}
        >
          <span>© {new Date().getFullYear()} brydon.io</span>
          <div className="flex gap-4">
            <a
              href="https://github.com/sean-brydon"
              target="_blank"
              rel="noopener noreferrer"
              className="no-underline hover:opacity-80 transition-opacity"
              style={{ color: "var(--text-muted)" }}
            >
              github
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
