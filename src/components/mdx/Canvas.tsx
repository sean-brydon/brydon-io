"use client";

import { useEffect, useRef, type ReactNode } from "react";

interface CanvasProps {
  children?: ReactNode;
  width?: number;
  height?: number;
  className?: string;
  id?: string;
}

export default function Canvas({ children, width = 400, height = 200, className, id }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d")!;
    const dpr = window.devicePixelRatio || 1;
    cvs.width = width * dpr;
    cvs.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Subtle dot grid
    const spacing = 20;
    for (let x = spacing; x < width; x += spacing) {
      for (let y = spacing; y < height; y += spacing) {
        ctx.fillStyle = "var(--text-muted)";
        ctx.globalAlpha = 0.15;
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Center accent dot
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = "#6366f1";
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }, [width, height]);

  return (
    <div className={`my-8 ${className || ""}`}>
      <div className="overflow-hidden rounded-lg" style={{ border: "1px solid var(--border)", background: "var(--code-bg)" }}>
        <canvas
          ref={canvasRef}
          id={id}
          style={{ width: "100%", height: height, display: "block" }}
        />
        {children && (
          <div className="p-3 text-xs" style={{ borderTop: "1px solid var(--border)", color: "var(--text-muted)" }}>
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
