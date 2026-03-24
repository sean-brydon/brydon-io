import type { Metadata } from "next";
import Link from "next/link";


export const metadata: Metadata = {
  title: "devl.dev — your dev portfolio, instantly",
  description:
    "create a beautiful developer portfolio in minutes. blog, projects, work history — all in one place.",
};

const features = [
  {
    title: "profile pages",
    description:
      "beautiful, customizable profile with bio, work history, and social links. claim your username and go live in minutes.",
  },
  {
    title: "notion-style blog",
    description:
      "rich editor powered by tiptap. write posts with markdown shortcuts, embeds, and syntax highlighting — no mdx config needed.",
  },
  {
    title: "social features",
    description:
      "followers, reactions, and comments built in. grow your audience without leaving your portfolio.",
  },
  {
    title: "custom tiptap blocks",
    description:
      "extend your editor with custom blocks — code sandboxes, callouts, embeds, and more. your content, your way.",
  },
  {
    title: "github integration",
    description:
      "auto-sync your contribution graph and pin repos. show recruiters what you ship, not just what you say.",
  },
  {
    title: "dark & light mode",
    description:
      "both themes look stunning out of the box. accent colors, particles, and smooth transitions included.",
  },
];

const pricingTiers = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "everything you need to get started",
    features: [
      "profile page with custom username",
      "blog with rich editor",
      "project showcase",
      "work history timeline",
      "github contribution graph",
      "dark & light mode",
    ],
    cta: "get started free",
    href: "/sign-up",
    popular: false,
  },
  {
    name: "Starter",
    price: "$99",
    period: "/mo",
    description: "for teams hiring developers",
    features: [
      "everything in Free",
      "up to 10 team seats",
      "candidate bookmarking",
      "advanced search & filters",
      "company profile page",
      "priority support",
    ],
    cta: "start free trial",
    href: "/sign-up",
    popular: true,
  },
  {
    name: "Business",
    price: "$299",
    period: "/mo",
    description: "for scaling engineering orgs",
    features: [
      "everything in Starter",
      "unlimited team seats",
      "API access",
      "custom integrations",
      "dedicated account manager",
      "SSO & audit logs",
    ],
    cta: "contact sales",
    href: "/sign-up",
    popular: false,
  },
];

export default function MarketingPage() {
  return (
    <div>
      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="relative">
        <div className="max-w-[960px] mx-auto px-5 pt-28 pb-20 text-center">
          <h1
            className="text-4xl sm:text-5xl font-bold mb-6 tracking-tight leading-tight"
            style={{ color: "var(--text)" }}
          >
            your dev portfolio,
            <br />
            <span style={{ color: "var(--accent)" }}>instantly.</span>
          </h1>
          <p
            className="text-sm sm:text-base leading-relaxed mb-10 max-w-lg mx-auto"
            style={{ color: "var(--text-muted)" }}
          >
            claim your page. showcase projects, write posts, track work history
            — all in one beautiful, developer-first portfolio. powered by
            particles.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/sign-up"
              className="text-sm no-underline px-7 py-3 rounded-lg font-medium transition-opacity hover:opacity-90"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              get started free →
            </Link>
            <Link
              href="/sean"
              className="text-sm no-underline px-7 py-3 rounded-lg font-medium transition-colors hover:opacity-80"
              style={{
                color: "var(--text-muted)",
                border: "1px solid var(--border)",
              }}
            >
              see live demo
            </Link>
          </div>
          <p
            className="mt-6 text-xs"
            style={{ color: "var(--text-muted)", opacity: 0.6 }}
          >
            no credit card required · free forever plan
          </p>
        </div>
      </section>

      {/* ── For Developers ────────────────────────────────── */}
      <section className="max-w-[960px] mx-auto px-5 py-24">
        <div className="text-center mb-14">
          <p
            className="text-xs uppercase tracking-widest mb-3"
            style={{ color: "var(--accent)" }}
          >
            for developers
          </p>
          <h2
            className="text-2xl sm:text-3xl font-bold tracking-tight mb-4"
            style={{ color: "var(--text)" }}
          >
            everything you need to stand out
          </h2>
          <p
            className="text-sm max-w-md mx-auto leading-relaxed"
            style={{ color: "var(--text-muted)" }}
          >
            a full-featured portfolio platform built for developers who ship.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="feature-card rounded-xl p-6 transition-all duration-200"
              style={{
                background: "var(--card-bg)",
                border: "1px solid var(--border)",
              }}
            >
              <h3
                className="text-sm font-semibold mb-2"
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

      {/* ── For Companies (Pricing) ───────────────────────── */}
      <section
        className="py-24"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <div className="max-w-[960px] mx-auto px-5">
          <div className="text-center mb-14">
            <p
              className="text-xs uppercase tracking-widest mb-3"
              style={{ color: "var(--accent)" }}
            >
              for companies
            </p>
            <h2
              className="text-2xl sm:text-3xl font-bold tracking-tight mb-4"
              style={{ color: "var(--text)" }}
            >
              find and hire the best developers
            </h2>
            <p
              className="text-sm max-w-md mx-auto leading-relaxed"
              style={{ color: "var(--text-muted)" }}
            >
              browse developer profiles, bookmark candidates, and build your
              engineering team faster.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {pricingTiers.map((tier) => (
              <div
                key={tier.name}
                className="rounded-xl p-6 flex flex-col relative"
                style={{
                  background: "var(--card-bg)",
                  border: tier.popular
                    ? "2px solid var(--accent)"
                    : "1px solid var(--border)",
                }}
              >
                {tier.popular && (
                  <span
                    className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-semibold px-3 py-1 rounded-full"
                    style={{ background: "var(--accent)", color: "#fff" }}
                  >
                    most popular
                  </span>
                )}
                <h3
                  className="text-sm font-semibold mb-1"
                  style={{ color: "var(--text)" }}
                >
                  {tier.name}
                </h3>
                <p
                  className="text-xs mb-4"
                  style={{ color: "var(--text-muted)" }}
                >
                  {tier.description}
                </p>
                <div className="mb-6">
                  <span
                    className="text-3xl font-bold"
                    style={{ color: "var(--text)" }}
                  >
                    {tier.price}
                  </span>
                  <span
                    className="text-xs ml-1"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {tier.period}
                  </span>
                </div>
                <ul className="flex-1 space-y-3 mb-6">
                  {tier.features.map((f) => (
                    <li
                      key={f}
                      className="text-xs flex items-start gap-2"
                      style={{ color: "var(--text-muted)" }}
                    >
                      <span style={{ color: "var(--accent)" }}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={tier.href}
                  className="text-xs no-underline text-center px-5 py-2.5 rounded-lg font-medium transition-opacity hover:opacity-90"
                  style={
                    tier.popular
                      ? { background: "var(--accent)", color: "#fff" }
                      : {
                          color: "var(--text)",
                          border: "1px solid var(--border)",
                        }
                  }
                >
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────── */}
      <section
        className="py-24 text-center"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <div className="max-w-[960px] mx-auto px-5">
          <h2
            className="text-2xl sm:text-3xl font-bold tracking-tight mb-4"
            style={{ color: "var(--text)" }}
          >
            ready to ship your portfolio?
          </h2>
          <p
            className="text-sm mb-8 max-w-md mx-auto leading-relaxed"
            style={{ color: "var(--text-muted)" }}
          >
            join developers who&apos;ve already claimed their page. it takes less
            than two minutes.
          </p>
          <Link
            href="/sign-up"
            className="text-sm no-underline px-7 py-3 rounded-lg font-medium transition-opacity hover:opacity-90 inline-block"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            create your portfolio →
          </Link>
        </div>
      </section>
    </div>
  );
}
