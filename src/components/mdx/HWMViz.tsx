"use client";

import { useEffect, useRef } from "react";

export default function HWMViz() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cvs = ref.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d")!;
    const dpr = Math.min(window.devicePixelRatio, 2);
    let raf = 0;
    let dead = false;

    const resize = () => {
      const r = cvs.getBoundingClientRect();
      cvs.width = r.width * dpr;
      cvs.height = r.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    // Seat changes over a "month" (30 data points)
    const seatEvents = [5,5,6,7,7,8,8,9,10,10,10,12,12,11,9,9,10,10,8,8,7,7,8,9,9,10,10,9,8,7];
    const maxSeats = 14;
    const start = performance.now();

    const draw = () => {
      if (dead) return;
      const r = cvs.getBoundingClientRect();
      const w = r.width, h = r.height;
      if (w === 0) { raf = requestAnimationFrame(draw); return; }
      const t = (performance.now() - start) / 1000;

      ctx.clearRect(0, 0, w, h);

      const isDark = document.documentElement.classList.contains("dark");
      const textCol = isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)";
      const gridCol = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
      const accentCol = isDark ? "#6366f1" : "#4f46e5";
      const hwmCol = "#f59e0b";
      const seatCol = isDark ? "rgba(99,102,241,0.5)" : "rgba(79,70,229,0.4)";

      const pad = { top: 24, bottom: 30, left: 36, right: 16 };
      const gw = w - pad.left - pad.right;
      const gh = h - pad.top - pad.bottom;

      // Grid lines
      ctx.strokeStyle = gridCol;
      ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const y = pad.top + (gh / 4) * i;
        ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(w - pad.right, y); ctx.stroke();
      }

      // Animated progress
      const progress = Math.min(1, (t * 0.4) % 1.6);
      const visibleCount = Math.floor(progress * seatEvents.length);

      // Track HWM
      let hwm = 0;
      const stepW = gw / (seatEvents.length - 1);

      // Draw seat line
      ctx.beginPath();
      ctx.strokeStyle = seatCol;
      ctx.lineWidth = 2;
      for (let i = 0; i <= visibleCount && i < seatEvents.length; i++) {
        const x = pad.left + i * stepW;
        const y = pad.top + gh - (seatEvents[i] / maxSeats) * gh;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        if (seatEvents[i] > hwm) hwm = seatEvents[i];
      }
      ctx.stroke();

      // Draw HWM line
      const hwmY = pad.top + gh - (hwm / maxSeats) * gh;
      ctx.beginPath();
      ctx.strokeStyle = hwmCol;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.moveTo(pad.left, hwmY);
      ctx.lineTo(pad.left + visibleCount * stepW, hwmY);
      ctx.stroke();
      ctx.setLineDash([]);

      // HWM label
      ctx.fillStyle = hwmCol;
      ctx.font = "600 10px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`hwm: ${hwm}`, pad.left + visibleCount * stepW + 6, hwmY + 3);

      // Current seat dot
      if (visibleCount < seatEvents.length) {
        const cx = pad.left + visibleCount * stepW;
        const cy = pad.top + gh - (seatEvents[visibleCount] / maxSeats) * gh;
        ctx.fillStyle = accentCol;
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = textCol;
        ctx.font = "500 9px monospace";
        ctx.textAlign = "center";
        ctx.fillText(`${seatEvents[visibleCount]} seats`, cx, cy - 10);
      }

      // Axis labels
      ctx.fillStyle = textCol;
      ctx.font = "500 9px monospace";
      ctx.textAlign = "center";
      ctx.fillText("billing period →", pad.left + gw / 2, h - 6);
      ctx.textAlign = "right";
      ctx.fillText("seats", pad.left - 6, pad.top + 4);

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => { dead = true; cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  return (
    <div className="my-8 rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)", background: "var(--code-bg)" }}>
      <canvas ref={ref} style={{ width: "100%", height: 220, display: "block" }} />
      <div className="px-3 py-2 text-[10px]" style={{ borderTop: "1px solid var(--border)", color: "var(--text-muted)" }}>
        seats fluctuate but you pay for the peak — the high water mark
      </div>
    </div>
  );
}
