"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-[640px] mx-auto px-5 py-20 text-center">
      <h2 className="text-lg font-bold mb-3" style={{ color: "var(--text)" }}>
        something went wrong
      </h2>
      <p className="text-xs mb-6" style={{ color: "var(--text-muted)" }}>
        {error.message || "an unexpected error occurred."}
      </p>
      <button
        onClick={reset}
        className="text-xs px-4 py-2 rounded-lg transition-opacity hover:opacity-80"
        style={{ background: "var(--accent)", color: "#fff", border: "none", cursor: "pointer" }}
      >
        try again
      </button>
    </div>
  );
}
