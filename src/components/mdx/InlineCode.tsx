import React from 'react';

interface InlineCodeProps {
  children?: React.ReactNode;
  [key: string]: unknown;
}

export default function InlineCode({ children, ...props }: InlineCodeProps) {
  return (
    <code
      className="text-xs px-1.5 py-0.5 rounded font-mono"
      style={{
        background: "var(--code-bg)",
        color: "var(--accent)",
        border: "1px solid var(--border)",
      }}
      {...props}
    >
      {children}
    </code>
  );
}
