"use client";

import React, { useEffect, useState } from "react";

interface CodeBlockProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

export default function CodeBlock({ children, className, title }: CodeBlockProps) {
  const language = className?.replace("language-", "") || "";
  const code = typeof children === "string" ? children : extractText(children);
  const [highlighted, setHighlighted] = useState<string | null>(null);

  useEffect(() => {
    if (!code || !language) return;
    let cancelled = false;

    (async () => {
      try {
        const { codeToHtml } = await import("shiki");
        const html = await codeToHtml(code.trim(), {
          lang: language,
          theme: "github-dark-default",
        });
        if (!cancelled) setHighlighted(html);
      } catch {
        // Language not supported — fall through to plain render
      }
    })();

    return () => { cancelled = true; };
  }, [code, language]);

  return (
    <div className="my-6 rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)" }}>
      {(title || language) && (
        <div
          className="px-3 py-1.5 text-[10px] font-mono flex items-center justify-between"
          style={{
            background: "var(--code-bg)",
            color: "var(--text-muted)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <span>{title || language}</span>
          <CopyButton text={code.trim()} />
        </div>
      )}
      {highlighted ? (
        <div
          className="shiki-wrapper text-xs leading-relaxed overflow-x-auto [&_pre]:!bg-transparent [&_pre]:!m-0 [&_pre]:!p-4 [&_code]:!text-xs [&_code]:!font-mono"
          style={{ background: "var(--code-bg)" }}
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
      ) : (
        <pre
          className="p-4 overflow-x-auto text-xs leading-relaxed m-0"
          style={{ background: "var(--code-bg)", color: "var(--text)" }}
        >
          <code className="font-mono">{children}</code>
        </pre>
      )}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="text-[10px] px-1.5 py-0.5 rounded transition-colors"
      style={{
        color: copied ? "var(--accent)" : "var(--text-muted)",
        background: "transparent",
        border: "none",
        cursor: "pointer",
      }}
    >
      {copied ? "copied" : "copy"}
    </button>
  );
}

function extractText(node: React.ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (!node) return "";
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (typeof node === "object" && "props" in node) {
    return extractText((node as React.ReactElement).props.children);
  }
  return "";
}
