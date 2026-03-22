"use client";

import { useEffect, useState } from "react";

// ── Table of Contents Component ──────────────────────────────────

export interface TocItem {
  id: string;
  num: string;
  label: string;
}

interface TableOfContentsProps {
  items: TocItem[];
  className?: string;
  position?: "fixed" | "relative";
}

export function TableOfContents({ 
  items, 
  className = "", 
  position = "fixed" 
}: TableOfContentsProps) {
  const [active, setActive] = useState("");
  const [visited, setVisited] = useState<Set<string>>(new Set());
  const [wide, setWide] = useState(false);

  // Check screen width on mount and resize
  useEffect(() => {
    const checkWidth = () => setWide(window.innerWidth > 1000);
    checkWidth(); // Initial check
    window.addEventListener("resize", checkWidth);
    return () => window.removeEventListener("resize", checkWidth);
  }, []);

  // Intersection observer for tracking active/visited sections
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
            setVisited((prev) => new Set([...prev, entry.target.id]));
          }
        }
      },
      { rootMargin: "-10% 0px -70% 0px" }
    );

    // Observe all section elements
    for (const item of items) {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [items]);

  const handleClick = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Base styles for positioning
  const positionStyles = position === "fixed" 
    ? {
        position: "fixed" as const,
        left: "max(20px, calc((100vw - 640px) / 2 - 190px))",
        top: "60px",
        display: wide ? "flex" : "none",
      }
    : {
        position: "relative" as const,
        display: "flex",
      };

  return (
    <nav
      className={`w-40 font-mono text-xs leading-relaxed flex-col gap-0.5 ${className}`}
      style={positionStyles}
    >
      <div className="text-[9px] opacity-25 uppercase tracking-wider mb-1.5 mt-5">
        contents
      </div>
      {items.map((item) => {
        const isActive = active === item.id;
        const isVisited = visited.has(item.id);
        
        return (
          <a
            key={item.id}
            href={`#${item.id}`}
            onClick={handleClick(item.id)}
            className={`
              no-underline py-1 px-2.5 block transition-all duration-200
              border-l-2 
              ${isActive 
                ? "text-[#6366f1] border-[#6366f1]" 
                : isVisited 
                  ? "text-white/45 border-white/12 hover:text-white/60" 
                  : "text-white/15 border-transparent hover:text-white/30"
              }
            `}
          >
            <span className="opacity-40">{item.num}</span> {item.label}
            {isVisited && !isActive && (
              <span className="opacity-25 ml-1.5">✓</span>
            )}
          </a>
        );
      })}
    </nav>
  );
}

// Utility hook for generating TOC items from headings
export function useTableOfContents(containerSelector = "main") {
  const [items, setItems] = useState<TocItem[]>([]);

  useEffect(() => {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    const headings = container.querySelectorAll("h1, h2, h3, h4, h5, h6");
    const tocItems: TocItem[] = Array.from(headings).map((heading, index) => {
      // Ensure each heading has an ID
      if (!heading.id) {
        heading.id = heading.textContent?.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-") || `heading-${index}`;
      }
      
      return {
        id: heading.id,
        num: String(index).padStart(2, "0"),
        label: heading.textContent || `Section ${index + 1}`,
      };
    });

    setItems(tocItems);
  }, [containerSelector]);

  return items;
}

// Example items for development/testing
export const EXAMPLE_TOC_ITEMS: TocItem[] = [
  { id: "introduction", num: "00", label: "introduction" },
  { id: "getting-started", num: "01", label: "getting started" },
  { id: "components", num: "02", label: "components" },
  { id: "styling", num: "03", label: "styling" },
  { id: "deployment", num: "04", label: "deployment" },
];