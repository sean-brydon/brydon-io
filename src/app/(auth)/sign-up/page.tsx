import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "sign up",
};

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link
            href="/"
            className="text-sm font-semibold no-underline"
            style={{ color: "var(--text)" }}
          >
            brydon.io
          </Link>
          <h1
            className="text-xl font-bold mt-6 mb-2"
            style={{ color: "var(--text)" }}
          >
            create your portfolio
          </h1>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            get started in under a minute
          </p>
        </div>

        {/* Placeholder form — will be connected to better-auth */}
        <form className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="block text-xs mb-1.5"
              style={{ color: "var(--text-muted)" }}
            >
              username
            </label>
            <div className="flex items-center">
              <input
                id="username"
                name="username"
                type="text"
                required
                placeholder="sean"
                className="w-full text-xs px-3 py-2.5 rounded-lg outline-none transition-colors"
                style={{
                  background: "var(--card-bg)",
                  color: "var(--text)",
                  border: "1px solid var(--border)",
                }}
              />
            </div>
            <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)", opacity: 0.6 }}>
              your portfolio will be at brydon.io/username
            </p>
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-xs mb-1.5"
              style={{ color: "var(--text-muted)" }}
            >
              email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              className="w-full text-xs px-3 py-2.5 rounded-lg outline-none transition-colors"
              style={{
                background: "var(--card-bg)",
                color: "var(--text)",
                border: "1px solid var(--border)",
              }}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs mb-1.5"
              style={{ color: "var(--text-muted)" }}
            >
              password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              placeholder="••••••••"
              className="w-full text-xs px-3 py-2.5 rounded-lg outline-none transition-colors"
              style={{
                background: "var(--card-bg)",
                color: "var(--text)",
                border: "1px solid var(--border)",
              }}
            />
          </div>

          <button
            type="submit"
            className="w-full text-xs font-medium px-3 py-2.5 rounded-lg transition-opacity hover:opacity-90"
            style={{
              background: "var(--accent)",
              color: "#fff",
              border: "none",
              cursor: "pointer",
            }}
          >
            create account
          </button>
        </form>

        <p
          className="text-center text-xs mt-6"
          style={{ color: "var(--text-muted)" }}
        >
          already have an account?{" "}
          <Link
            href="/sign-in"
            className="no-underline font-medium"
            style={{ color: "var(--accent)" }}
          >
            sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
