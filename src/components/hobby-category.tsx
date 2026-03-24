"use client";

export function HobbyCategory({
  label,
  items,
}: {
  label: string;
  items: { name: string; detail: string }[];
}) {
  return (
    <div>
      <span
        className="text-[11px] font-medium uppercase tracking-wider block mb-3"
        style={{ color: "var(--text-muted)", opacity: 0.5 }}
      >
        {label}
      </span>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.name}>
            <p className="text-xs font-medium" style={{ color: "var(--text)" }}>
              {item.name}
            </p>
            <p className="text-[11px]" style={{ color: "var(--text-muted)", opacity: 0.6 }}>
              {item.detail}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
