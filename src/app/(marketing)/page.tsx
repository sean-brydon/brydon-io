import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "brydon.io — your dev portfolio, instantly",
  description: "create a beautiful developer portfolio in minutes. blog, projects, work history — all in one place.",
};

export default function MarketingPage() {
  return (
    <div className="max-w-[640px] mx-auto px-5 py-20">
      {/* Hero */}
      <section className="mb-24 text-center">
        <h1
          className="text-3xl font-bold mb-4 tracking-tight"
          style={{ color: "var(--text)" }}
        >
          your dev portfolio,
          <br />
          <span style={{ color: "var(--accent)" }}>instantly.</span>
        </h1>
        <p
          className="text-sm leading-relaxed mb-8 max-w-md mx-auto"
          style={{ color: "var(--text-muted)" }}
        >
          create a beautiful developer portfolio in minutes. blog, projects,
          work history — powered by mdx, styled with particles.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/sign-up"
            className="text-xs no-underline px-5 py-2.5 rounded-lg font-medium transition-opacity hover:opacity-90"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            get started free →
          </Link>
          <Link
            href="/sean"
            className="text-xs no-underline px-5 py-2.5 rounded-lg font-medium transition-colors"
            style={{
              color: "var(--text-muted)",
              border: "1px solid var(--border)",
            }}
          >
            see demo
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="mb-24">
        <h2
          className="text-xs uppercase tracking-wider mb-8 text-center"
          style={{ color: "var(--text-muted)", opacity: 0.5 }}
        >
          features
        </h2>

        <div className="grid grid-cols-2 gap-8">
          {[
            {
              title: "mdx blog",
              description: "write posts in markdown with react components. syntax highlighting, og images — all built in.",
            },
            {
              title: "project showcase",
              description: "display your work with tags, links, and descriptions. keep it minimal or go detailed.",
            },
            {
              title: "work timeline",
              description: "elegant experience timeline with companies, roles, and tech stacks.",
            },
            {
              title: "custom themes",
              description: "dark mode, light mode, and customizable accent colors. looks great on any device.",
            },
            {
              title: "github contributions",
              description: "show your activity graph right on your portfolio. auto-synced.",
            },
            {
              title: "your domain",
              description: "get yourname.brydon.io or bring your own custom domain.",
            },
          ].map((feature) => (
            <div key={feature.title}>
              <h3
                className="text-sm font-semibold mb-1"
                style={{ color: "var(--text)" }}
              >
                {feature.title}
              </h3>
              <p
                className="text-xs leading-relaxed"
                style={{ color: "var(--text-muted)" }}
              >
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center mb-12">
        <p
          className="text-sm mb-4"
          style={{ color: "var(--text-muted)" }}
        >
          ready to ship your portfolio?
        </p>
        <Link
          href="/sign-up"
          className="text-xs no-underline px-5 py-2.5 rounded-lg font-medium transition-opacity hover:opacity-90"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          create your portfolio →
        </Link>
      </section>
    </div>
  );
}
