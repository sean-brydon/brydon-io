"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

interface ContributionDay {
  date: string;
  count: number;
  level: number;
}

interface ContributionData {
  total: Record<string, number>;
  contributions: ContributionDay[];
}

interface Week {
  days: (ContributionDay | null)[];
}

const DARK_COLORS = [
  "rgba(255,255,255,0.04)",
  "rgba(99,102,241,0.25)",
  "rgba(99,102,241,0.45)",
  "rgba(99,102,241,0.65)",
  "rgba(99,102,241,0.9)",
];

const LIGHT_COLORS = [
  "rgba(0,0,0,0.04)",
  "rgba(79,70,229,0.15)",
  "rgba(79,70,229,0.3)",
  "rgba(79,70,229,0.5)",
  "rgba(79,70,229,0.75)",
];

export function GitHubContributions({
  username = "sean-brydon",
  className = "",
}: {
  username?: string;
  className?: string;
}) {
  const [data, setData] = useState<ContributionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    fetch(`https://github-contributions-api.jogruber.de/v4/${username}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [username]);

  if (!mounted || loading) {
    return (
      <div className={`${className}`}>
        <div className="h-[130px] rounded-lg animate-pulse" style={{ background: "var(--card-bg)" }} />
      </div>
    );
  }

  if (!data) return null;

  const isDark = resolvedTheme === "dark";
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;

  // Build weekly grid
  const sorted = [...data.contributions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - 364);

  const map = new Map<string, ContributionDay>();
  sorted.forEach((d) => map.set(d.date, d));

  const weekStart = new Date(start);
  weekStart.setDate(start.getDate() - start.getDay());

  const weeks: Week[] = [];
  const cur = new Date(weekStart);

  while (cur <= today) {
    const week: Week = { days: [] };
    for (let d = 0; d < 7; d++) {
      const dateStr = cur.toISOString().split("T")[0];
      if (cur >= start && cur <= today) {
        week.days.push(map.get(dateStr) || { date: dateStr, count: 0, level: 0 });
      } else {
        week.days.push(null);
      }
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(week);
  }

  // Month labels
  const months: { label: string; col: number }[] = [];
  const monthNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  let lastMonth = -1;
  weeks.forEach((week, i) => {
    const first = week.days.find((d) => d !== null);
    if (first) {
      const m = new Date(first.date).getMonth();
      if (m !== lastMonth) {
        months.push({ label: monthNames[m], col: i });
        lastMonth = m;
      }
    }
  });

  const currentYear = new Date().getFullYear();
  const total = data.total[currentYear] || 0;

  const CELL = 10;
  const GAP = 3;
  const step = CELL + GAP;

  return (
    <div className={`${className} relative font-mono`}>
      <div className="flex items-baseline justify-between mb-4">
        <span className="text-xs" style={{ color: "var(--text)" }}>github</span>
        <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
          {total} contributions in {currentYear}
        </span>
      </div>

      <div className="overflow-x-auto">
        <svg width={weeks.length * step + 28} height={7 * step + 20} style={{ display: "block" }}>
          {months.map(({ label, col }) => (
            <text
              key={`${label}-${col}`}
              x={col * step + 28}
              y={10}
              className="text-[9px] font-mono"
              style={{ fill: "var(--text-muted)" }}
            >
              {label}
            </text>
          ))}

          {["mon", "wed", "fri"].map((day, i) => (
            <text
              key={day}
              x={0}
              y={20 + [1, 3, 5][i] * step + CELL * 0.75}
              className="text-[9px] font-mono"
              style={{ fill: "var(--text-muted)" }}
            >
              {day}
            </text>
          ))}

          {weeks.map((week, wi) =>
            week.days.map((day, di) => {
              if (!day) return null;
              const x = wi * step + 28;
              const y = di * step + 16;
              return (
                <rect
                  key={day.date}
                  x={x}
                  y={y}
                  width={CELL}
                  height={CELL}
                  rx={2}
                  style={{ fill: colors[day.level] || colors[0] }}
                  onMouseEnter={(e) => {
                    const r = (e.target as SVGRectElement).getBoundingClientRect();
                    setTooltip({ x: r.left + r.width / 2, y: r.top, text: `${day.count} on ${day.date}` });
                  }}
                  onMouseLeave={() => setTooltip(null)}
                />
              );
            })
          )}
        </svg>
      </div>

      <div className="flex items-center justify-end gap-1.5 mt-3">
        <span className="text-[9px]" style={{ color: "var(--text-muted)" }}>less</span>
        {[0, 1, 2, 3, 4].map((l) => (
          <span
            key={l}
            className="inline-block rounded-sm"
            style={{ width: 10, height: 10, background: colors[l] }}
          />
        ))}
        <span className="text-[9px]" style={{ color: "var(--text-muted)" }}>more</span>
      </div>

      {tooltip && (
        <div
          className="fixed z-50 px-2 py-1 rounded text-[10px] font-mono pointer-events-none"
          style={{
            left: tooltip.x,
            top: tooltip.y - 30,
            transform: "translateX(-50%)",
            background: "var(--text)",
            color: "var(--bg)",
          }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
}

export default GitHubContributions;
