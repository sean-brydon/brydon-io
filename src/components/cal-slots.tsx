"use client";

import { useEffect, useState } from "react";

interface SlotsData {
  [date: string]: { time: string }[];
}

export function CalSlots() {
  const [slots, setSlots] = useState<SlotsData>({});
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() + 1);
    const end = new Date(start);
    end.setDate(end.getDate() + 5);

    const startStr = start.toISOString().split("T")[0] + "T00:00:00.000Z";
    const endStr = end.toISOString().split("T")[0] + "T00:00:00.000Z";

    fetch(
      `https://api.cal.com/v2/slots/available?startTime=${startStr}&endTime=${endStr}&eventTypeSlug=30min&usernameList%5B%5D=sean`
    )
      .then((r) => r.json())
      .then((d) => {
        const s = d.data?.slots || {};
        setSlots(s);
        // Auto-select first date with slots
        const first = Object.keys(s).find((k) => s[k]?.length > 0);
        if (first) setSelectedDate(first);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-lg p-4" style={{ border: "1px solid var(--border)", background: "var(--card-bg)" }}>
        <div className="flex gap-2 mb-4">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="w-14 h-14 rounded-md animate-pulse" style={{ background: "var(--border)" }} />
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="w-16 h-7 rounded animate-pulse" style={{ background: "var(--border)" }} />
          ))}
        </div>
      </div>
    );
  }

  const dates = Object.entries(slots).filter(([, s]) => s.length > 0).slice(0, 5);

  if (dates.length === 0) {
    return (
      <a
        href="https://i.cal.com/sean/30min"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-xs no-underline px-4 py-2.5 rounded-lg transition-opacity hover:opacity-80"
        style={{ background: "var(--accent)", color: "#fff" }}
      >
        book a call — i.cal.com/sean
      </a>
    );
  }

  const activeSlots = selectedDate ? slots[selectedDate] || [] : [];

  return (
    <div className="rounded-lg p-4" style={{ border: "1px solid var(--border)", background: "var(--card-bg)" }}>
      {/* Date selector row */}
      <div className="flex gap-1.5 mb-4">
        {dates.map(([date, daySlots]) => {
          const d = new Date(date + "T12:00:00");
          const isActive = date === selectedDate;
          const dayName = d.toLocaleDateString("en-US", { weekday: "short" }).toLowerCase();
          const dayNum = d.getDate();

          return (
            <button
              key={date}
              onClick={() => setSelectedDate(date)}
              className="flex flex-col items-center justify-center rounded-md px-3 py-2 transition-all text-center cursor-pointer"
              style={{
                background: isActive ? "var(--accent)" : "transparent",
                color: isActive ? "#fff" : "var(--text-muted)",
                border: isActive ? "1px solid var(--accent)" : "1px solid var(--border)",
                minWidth: 52,
              }}
            >
              <span className="text-[10px] opacity-70">{dayName}</span>
              <span className="text-sm font-semibold">{dayNum}</span>
              <span className="text-[9px] opacity-50">{daySlots.length} slots</span>
            </button>
          );
        })}
      </div>

      {/* Time slots grid */}
      <div className="flex flex-wrap gap-1.5">
        {activeSlots.map((slot) => {
          const t = new Date(slot.time);
          const timeStr = t.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          }).toLowerCase();
          const bookUrl = `https://i.cal.com/sean/30min?overlayCalendar=true&date=${selectedDate}&layout=month_view&slot=${encodeURIComponent(slot.time)}`;

          return (
            <a
              key={slot.time}
              href={bookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] no-underline px-2.5 py-1.5 rounded-md transition-all"
              style={{
                border: "1px solid var(--border)",
                color: "var(--accent)",
                background: "transparent",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--accent)";
                e.currentTarget.style.color = "#fff";
                e.currentTarget.style.borderColor = "var(--accent)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--accent)";
                e.currentTarget.style.borderColor = "var(--border)";
              }}
            >
              {timeStr}
            </a>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-3 pt-3 flex items-center justify-between" style={{ borderTop: "1px solid var(--border)" }}>
        <span className="text-[10px]" style={{ color: "var(--text-muted)", opacity: 0.4 }}>
          30 min · powered by cal.com
        </span>
        <a
          href="https://i.cal.com/sean/30min"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] no-underline"
          style={{ color: "var(--accent)" }}
        >
          view all times
        </a>
      </div>
    </div>
  );
}
