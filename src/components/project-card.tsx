"use client";

export function ProjectCard({
  title,
  description,
  url,
  tags,
}: {
  title: string;
  description: string;
  url: string;
  tags: string[];
}) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block no-underline group p-4 -mx-4 rounded-lg transition-colors"
      style={{ background: "transparent" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--card-bg)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <div className="flex items-baseline justify-between mb-1.5">
        <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>
          {title}
          <span className="ml-1 opacity-0 group-hover:opacity-40 transition-opacity">↗</span>
        </h3>
      </div>
      <p className="text-xs leading-relaxed mb-3" style={{ color: "var(--text-muted)" }}>
        {description}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <span
            key={tag}
            className="text-[10px] px-2 py-0.5 rounded-full"
            style={{
              background: "var(--card-bg)",
              color: "var(--text-muted)",
              border: "1px solid var(--border)",
            }}
          >
            {tag}
          </span>
        ))}
      </div>
    </a>
  );
}
