"use client";

import { useEffect, useRef } from "react";

export default function DunningViz() {
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

    const tiers = [
      { label: "current", color: "#22c55e", blocks: [] as string[] },
      { label: "warning", color: "#f59e0b", blocks: ["emails sent"] },
      { label: "soft block", color: "#f97316", blocks: ["+ invites blocked", "+ event types blocked"] },
      { label: "hard block", color: "#ef4444", blocks: ["+ bookings blocked", "+ api blocked"] },
      { label: "cancelled", color: "#991b1b", blocks: ["subscription ended"] },
    ];

    const start = performance.now();

    const draw = () => {
      if (dead) return;
      const r = cvs.getBoundingClientRect();
      const w = r.width, h = r.height;
      if (w === 0) { raf = requestAnimationFrame(draw); return; }
      const t = (performance.now() - start) / 1000;

      ctx.clearRect(0, 0, w, h);

      const isDark = document.documentElement.classList.contains("dark");
      const textCol = isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)";
      const dimCol = isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)";
      const successCol = "#22c55e";

      // Cycle: advance through tiers, then "payment succeeds" snap back
      const cycleDuration = 8; // seconds per full cycle
      const phase = t % cycleDuration;
      const advancePhase = Math.min(phase / 5, 1); // 0-5s: advance
      const resetPhase = phase > 6 ? Math.min((phase - 6) / 0.3, 1) : 0; // 6-6.3s: snap back

      const activeTier = resetPhase > 0 ? 0 : Math.min(4, Math.floor(advancePhase * 5));

      const tierW = (w - 40) / tiers.length;
      const tierH = 50;
      const baseY = h / 2 - tierH / 2;

      // Draw connection lines
      for (let i = 0; i < tiers.length - 1; i++) {
        const x1 = 20 + i * tierW + tierW - 4;
        const x2 = 20 + (i + 1) * tierW + 4;
        const y = baseY + tierH / 2;
        ctx.strokeStyle = i < activeTier ? tiers[Math.min(i + 1, 4)].color : dimCol;
        ctx.lineWidth = i < activeTier ? 2 : 1;
        ctx.beginPath();
        ctx.moveTo(x1, y);
        ctx.lineTo(x2, y);
        ctx.stroke();

        // Arrow
        ctx.fillStyle = ctx.strokeStyle;
        ctx.beginPath();
        ctx.moveTo(x2, y - 3);
        ctx.lineTo(x2 + 4, y);
        ctx.lineTo(x2, y + 3);
        ctx.fill();
      }

      // Draw tier boxes
      for (let i = 0; i < tiers.length; i++) {
        const tier = tiers[i];
        const x = 20 + i * tierW + 4;
        const bw = tierW - 8;
        const isActive = i === activeTier;
        const isPast = i < activeTier;

        // Box
        ctx.globalAlpha = isActive ? 1 : isPast ? 0.4 : 0.15;
        ctx.strokeStyle = tier.color;
        ctx.lineWidth = isActive ? 2 : 1;
        ctx.beginPath();
        ctx.roundRect(x, baseY, bw, tierH, 6);
        ctx.stroke();

        if (isActive) {
          ctx.fillStyle = tier.color;
          ctx.globalAlpha = 0.08;
          ctx.fill();
        }

        // Label
        ctx.globalAlpha = isActive ? 0.9 : isPast ? 0.4 : 0.2;
        ctx.fillStyle = isActive ? tier.color : textCol;
        ctx.font = `${isActive ? "600" : "500"} ${isActive ? 11 : 9}px monospace`;
        ctx.textAlign = "center";
        ctx.fillText(tier.label, x + bw / 2, baseY + tierH / 2 + 4);

        ctx.globalAlpha = 1;
      }

      // Blocked features for active tier
      const active = tiers[activeTier];
      if (active.blocks.length > 0) {
        ctx.fillStyle = active.color;
        ctx.globalAlpha = 0.6;
        ctx.font = "500 9px monospace";
        ctx.textAlign = "center";
        active.blocks.forEach((block, i) => {
          ctx.fillText(block, w / 2, baseY + tierH + 18 + i * 14);
        });
        ctx.globalAlpha = 1;
      }

      // Payment success flash
      if (resetPhase > 0 && resetPhase < 1) {
        ctx.fillStyle = successCol;
        ctx.globalAlpha = 0.7 * (1 - resetPhase);
        ctx.font = "600 12px monospace";
        ctx.textAlign = "center";
        ctx.fillText("payment succeeded → reset", w / 2, baseY - 16);
        ctx.globalAlpha = 1;
      }

      // Day labels
      ctx.fillStyle = textCol;
      ctx.globalAlpha = 0.3;
      ctx.font = "500 8px monospace";
      ctx.textAlign = "center";
      const dayLabels = ["", "day 0", "day 7", "day 14", "day 21"];
      for (let i = 1; i < tiers.length; i++) {
        const x = 20 + i * tierW + (tierW - 8) / 2;
        ctx.fillText(dayLabels[i], x, baseY - 6);
      }
      ctx.globalAlpha = 1;

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => { dead = true; cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  return (
    <div className="my-8 rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)", background: "var(--code-bg)" }}>
      <canvas ref={ref} style={{ width: "100%", height: 200, display: "block" }} />
      <div className="px-3 py-2 text-[10px]" style={{ borderTop: "1px solid var(--border)", color: "var(--text-muted)" }}>
        tiers advance over 21 days — payment at any point resets to current
      </div>
    </div>
  );
}
