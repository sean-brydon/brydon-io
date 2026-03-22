"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "monospace",
          background: "#050505",
          color: "#e0e0e0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          margin: 0,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
            something went wrong
          </h2>
          <p style={{ fontSize: 12, opacity: 0.5, marginBottom: 24 }}>
            {error.message || "an unexpected error occurred."}
          </p>
          <button
            onClick={reset}
            style={{
              fontSize: 12,
              padding: "8px 20px",
              borderRadius: 8,
              background: "#6366f1",
              color: "#fff",
              border: "none",
              cursor: "pointer",
            }}
          >
            try again
          </button>
        </div>
      </body>
    </html>
  );
}
