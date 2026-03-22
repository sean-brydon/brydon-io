export function Footer() {
  return (
    <footer className="max-w-[640px] mx-auto px-5 py-12">
      <div
        className="flex items-center justify-between text-xs"
        style={{ color: "var(--text-muted)", opacity: 0.5 }}
      >
        <span>© {new Date().getFullYear()} sean brydon</span>
        <div className="flex gap-4">
          <a
            href="https://github.com/sean-brydon"
            target="_blank"
            rel="noopener noreferrer"
            className="no-underline hover:opacity-80 transition-opacity"
            style={{ color: "var(--text-muted)" }}
          >
            github
          </a>
          <a
            href="https://x.com/SeanBrydon13"
            target="_blank"
            rel="noopener noreferrer"
            className="no-underline hover:opacity-80 transition-opacity"
            style={{ color: "var(--text-muted)" }}
          >
            x/twitter
          </a>
        </div>
      </div>
    </footer>
  );
}
