"use client";

import { useState, useRef, useCallback } from "react";

export interface LinkDef {
  url: string;
  title: string;
  description: string;
  favicon?: string;
  image?: string;
}

export const PORTFOLIO_LINKS: Record<string, LinkDef> = {
  "next.js": {
    url: "https://nextjs.org",
    title: "Next.js",
    description: "The React Framework for the Web.",
    favicon: "https://nextjs.org/favicon.ico",
  },
  react: {
    url: "https://react.dev",
    title: "React",
    description: "A JavaScript library for building user interfaces.",
    favicon: "https://react.dev/favicon.ico",
  },
  typescript: {
    url: "https://www.typescriptlang.org",
    title: "TypeScript",
    description: "TypeScript is JavaScript with syntax for types.",
    favicon: "https://www.typescriptlang.org/favicon-32x32.png",
  },
  "three.js": {
    url: "https://threejs.org",
    title: "Three.js",
    description: "JavaScript 3D library using WebGL.",
    favicon: "https://threejs.org/favicon.ico",
  },
  tailwind: {
    url: "https://tailwindcss.com",
    title: "Tailwind CSS",
    description: "A utility-first CSS framework.",
    favicon: "https://tailwindcss.com/favicon-32x32.png",
  },
  mdx: {
    url: "https://mdxjs.com",
    title: "MDX",
    description: "Markdown for the component era. Write JSX in your markdown.",
    favicon: "https://mdxjs.com/favicon.ico",
  },
  convex: {
    url: "https://convex.dev",
    title: "Convex",
    description: "The reactive backend. Real-time database and server functions.",
    favicon: "https://convex.dev/favicon.ico",
  },
  "cal.com": {
    url: "https://cal.com",
    title: "Cal.com",
    description: "Scheduling infrastructure for everyone.",
    favicon: "https://cal.com/favicon.ico",
  },
};

interface LinkPreviewProps {
  id: string;
  children: React.ReactNode;
  links?: Record<string, LinkDef>;
}

export function LinkPreview({ id, children, links = PORTFOLIO_LINKS }: LinkPreviewProps) {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState<"above" | "below">("above");
  const ref = useRef<HTMLSpanElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const link = links[id];

  const handleEnter = useCallback(() => {
    clearTimeout(timeoutRef.current);
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setPos(rect.top > 300 ? "above" : "below");
    }
    timeoutRef.current = setTimeout(() => setShow(true), 300);
  }, []);

  const handleLeave = useCallback(() => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setShow(false), 200);
  }, []);

  if (!link) return <span style={{ color: "var(--accent)", fontWeight: 600 }}>{children}</span>;

  return (
    <span
      ref={ref}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      className="relative inline-block"
      style={{ zIndex: show ? 50 : "auto" }}
    >
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className="no-underline font-semibold transition-colors"
        style={{
          color: "var(--accent)",
          borderBottom: "1px dashed color-mix(in srgb, var(--accent) 40%, transparent)",
          paddingBottom: 1,
        }}
      >
        {children}
      </a>
      {show && (
        <span
          onMouseEnter={() => {
            clearTimeout(timeoutRef.current);
            setShow(true);
          }}
          onMouseLeave={handleLeave}
          className="absolute left-1/2 -translate-x-1/2 overflow-hidden pointer-events-auto isolate"
          style={{
            ...(pos === "above" ? { bottom: "calc(100% + 8px)" } : { top: "calc(100% + 8px)" }),
            width: 280,
            background: "var(--bg)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            zIndex: 9999,
            boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
          }}
        >
          {link.image && (
            <img
              src={link.image}
              alt=""
              style={{ width: "100%", height: 120, objectFit: "cover", display: "block" }}
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          )}
          <span style={{ display: "block", padding: "10px 12px" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              {link.favicon && (
                <img
                  src={link.favicon}
                  alt=""
                  style={{ width: 14, height: 14, borderRadius: 3 }}
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
              )}
              <span className="text-xs font-bold" style={{ color: "var(--text)" }}>
                {link.title}
              </span>
            </span>
            <span className="text-[11px] leading-relaxed block" style={{ color: "var(--text-muted)" }}>
              {link.description}
            </span>
            <span className="text-[10px] block mt-1.5" style={{ color: "var(--accent)", opacity: 0.6 }}>
              {link.url.replace("https://", "")}
            </span>
          </span>
        </span>
      )}
    </span>
  );
}
