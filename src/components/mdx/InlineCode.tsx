import React from "react";

interface InlineCodeProps {
  children?: React.ReactNode;
  [key: string]: unknown;
}

export default function InlineCode({ children, ...props }: InlineCodeProps) {
  return (
    <code
      className="text-xs px-1.5 py-0.5 rounded font-mono"
      style={{
        background: "var(--blog-code-bg)",
        color: "var(--blog-accent)",
        border: "1px solid var(--blog-border)",
      }}
      {...props}
    >
      {children}
    </code>
  );
}
