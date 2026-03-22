"use client";

import { useEffect, useState, type ReactNode } from "react";
import * as runtime from "react/jsx-runtime";
import { evaluate } from "@mdx-js/mdx";
import { LinkPreview } from "./mdx/LinkPreview";
import Callout from "./mdx/Callout";
import Canvas from "./mdx/Canvas";
import CodeBlock from "./mdx/CodeBlock";
import InlineCode from "./mdx/InlineCode";

// Smart code component: detects fenced blocks vs inline
function SmartCode(props: React.ComponentProps<"code"> & { children?: React.ReactNode }) {
  const { className, children, ...rest } = props;
  // If it has a language class, it's inside a <pre> — let pre handle it
  if (className && className.startsWith("language-")) {
    return <code className={className} {...rest}>{children}</code>;
  }
  // Otherwise it's inline code
  return <InlineCode {...props} />;
}

// Smart pre component: intercepts <pre><code className="language-x"> and routes to CodeBlock
function SmartPre(props: React.ComponentProps<"pre"> & { children?: React.ReactNode }) {
  const { children, ...rest } = props;
  // Check if the child is a <code> element with a language class
  if (children && typeof children === "object" && "props" in children) {
    const codeProps = (children as React.ReactElement).props;
    if (codeProps?.className && codeProps.className.startsWith("language-")) {
      return (
        <CodeBlock className={codeProps.className}>
          {codeProps.children}
        </CodeBlock>
      );
    }
  }
  // Fallback for plain pre blocks
  return (
    <pre className="text-xs leading-relaxed mb-6 p-4 rounded-lg overflow-x-auto" style={{ background: "var(--code-bg)", border: "1px solid var(--border)", color: "var(--text)" }} {...rest}>
      {children}
    </pre>
  );
}

const mdxComponents = {
  LinkPreview,
  Callout,
  Canvas,
  CodeBlock,
  code: SmartCode,
  h1: (props: React.ComponentProps<"h1">) => (
    <h1 className="text-xl font-bold mt-10 mb-4" style={{ color: "var(--text)" }} {...props} />
  ),
  h2: (props: React.ComponentProps<"h2">) => (
    <h2 className="text-lg font-bold mt-10 mb-4 pb-2" style={{ color: "var(--text)", borderBottom: "1px solid var(--border)" }} {...props} />
  ),
  h3: (props: React.ComponentProps<"h3">) => (
    <h3 className="text-base font-semibold mt-6 mb-3" style={{ color: "var(--text)" }} {...props} />
  ),
  p: (props: React.ComponentProps<"p">) => (
    <p className="text-sm leading-relaxed mb-5" style={{ color: "var(--text-muted)" }} {...props} />
  ),
  ul: (props: React.ComponentProps<"ul">) => (
    <ul className="text-sm leading-relaxed mb-5 pl-5 list-disc space-y-1" style={{ color: "var(--text-muted)" }} {...props} />
  ),
  ol: (props: React.ComponentProps<"ol">) => (
    <ol className="text-sm leading-relaxed mb-5 pl-5 list-decimal space-y-1" style={{ color: "var(--text-muted)" }} {...props} />
  ),
  strong: (props: React.ComponentProps<"strong">) => (
    <strong style={{ color: "var(--text)", fontWeight: 600 }} {...props} />
  ),
  em: (props: React.ComponentProps<"em">) => (
    <em style={{ color: "var(--text)" }} {...props} />
  ),
  a: (props: React.ComponentProps<"a">) => (
    <a className="no-underline font-medium" style={{ color: "var(--accent)", borderBottom: "1px dashed color-mix(in srgb, var(--accent) 40%, transparent)", paddingBottom: "1px" }} target="_blank" rel="noopener noreferrer" {...props} />
  ),
  pre: SmartPre,
  blockquote: (props: React.ComponentProps<"blockquote">) => (
    <blockquote className="mb-5 pl-4 italic text-sm" style={{ borderLeft: "3px solid var(--accent)", color: "var(--text-muted)" }} {...props} />
  ),
  hr: () => <hr className="my-10 border-none h-px" style={{ background: "var(--border)" }} />,
};

export function MDXContent({ source }: { source: string }) {
  const [content, setContent] = useState<ReactNode>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { default: MDXComponent } = await evaluate(source, {
          ...(runtime as any),
          development: false,
        });
        if (!cancelled) {
          setContent(<MDXComponent components={mdxComponents as any} />);
        }
      } catch (err) {
        console.error("MDX render error:", err);
        if (!cancelled) {
          setContent(
            <pre className="text-xs p-4 rounded-lg" style={{ color: "var(--text-muted)", background: "var(--code-bg)" }}>
              {source}
            </pre>
          );
        }
      }
    })();
    return () => { cancelled = true; };
  }, [source]);

  if (!content) {
    return (
      <div className="animate-pulse space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-4 rounded" style={{ background: "var(--card-bg)", width: `${70 + Math.random() * 30}%` }} />
        ))}
      </div>
    );
  }

  return <>{content}</>;
}
