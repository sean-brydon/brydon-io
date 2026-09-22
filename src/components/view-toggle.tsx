"use client";

import { cn } from "@/lib/utils";

export type View = "portfolio" | "guestbook";

const VIEWS: { value: View; label: string }[] = [
  { value: "portfolio", label: "Portfolio" },
  { value: "guestbook", label: "Guestbook" },
];

const EASE = "ease-[cubic-bezier(0.7,0,0.3,1)]";

/**
 * Two-option switch whose indicator is a gooey blob: a pill and a trailing
 * droplet move at different speeds, and an SVG threshold filter melts them
 * together mid-flight. Labels sit above the filter so they stay crisp.
 */
export function ViewToggle({
  value,
  onChange,
  className,
  ref,
}: {
  value: View;
  onChange: (view: View) => void;
  className?: string;
  ref?: React.Ref<HTMLDivElement>;
}) {
  const second = value === "guestbook";

  return (
    <div
      ref={ref}
      role="tablist"
      aria-label="View"
      className={cn(
        "relative flex rounded-full border bg-background/85 p-1 shadow-lg/5 backdrop-blur",
        className,
      )}
    >
      <svg aria-hidden className="absolute size-0">
        <defs>
          <filter id="goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -10"
            />
          </filter>
        </defs>
      </svg>

      <div aria-hidden className="absolute inset-1 [filter:url(#goo)]">
        <span
          className={cn(
            "absolute inset-y-0 w-1/2 rounded-full bg-foreground transition-[left] duration-500",
            EASE,
          )}
          style={{ left: second ? "50%" : "0%" }}
        />
        <span
          className={cn(
            "absolute inset-y-1 w-1/4 rounded-full bg-foreground transition-[left] delay-100 duration-700",
            EASE,
          )}
          style={{ left: second ? "62.5%" : "12.5%" }}
        />
      </div>

      {VIEWS.map((view) => (
        <button
          key={view.value}
          type="button"
          role="tab"
          aria-selected={value === view.value}
          onClick={() => onChange(view.value)}
          className={cn(
            "relative z-10 w-28 cursor-pointer rounded-full py-2 font-medium text-sm outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-ring",
            value === view.value ? "text-background" : "text-muted-foreground",
          )}
        >
          {view.label}
        </button>
      ))}
    </div>
  );
}
