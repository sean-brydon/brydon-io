"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// ── Shared wrapper for all step demos ──
function StepCanvas({
  height = 280,
  label,
  init,
}: {
  height?: number;
  label?: string;
  init: (ctx: CanvasRenderingContext2D, cvs: HTMLCanvasElement) => (() => void) | void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d")!;
    const dpr = Math.min(window.devicePixelRatio, 2);
    let cleanup: (() => void) | void;
    let initialized = false;

    const resize = () => {
      const rect = cvs.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      cvs.width = rect.width * dpr;
      cvs.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Initialize on first valid size (handles late mobile layout)
      if (!initialized) {
        initialized = true;
        cleanup = init(ctx, cvs);
      }
    };

    // ResizeObserver catches initial layout + any resizes
    const obs = new ResizeObserver(resize);
    obs.observe(cvs);
    // Also try immediately in case already laid out
    resize();

    return () => {
      obs.disconnect();
      if (cleanup) cleanup();
    };
  }, [init]);

  return (
    <div
      className="my-6 rounded-lg overflow-hidden"
      style={{ border: "1px solid var(--border)", background: "var(--code-bg)" }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height, display: "block" }}
      />
      {label && (
        <div
          className="px-3 py-2 text-[10px] font-mono"
          style={{ borderTop: "1px solid var(--border)", color: "var(--text-muted)", opacity: 0.6 }}
        >
          {label}
        </div>
      )}
    </div>
  );
}

// ── Step 1: Static grid of particles ──
export function Step1Grid() {
  const init = useCallback((ctx: CanvasRenderingContext2D, cvs: HTMLCanvasElement) => {
    const draw = () => {
      const rect = cvs.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      if (w === 0) return;

      ctx.clearRect(0, 0, w, h);
      const isDark = document.documentElement.classList.contains("dark");
      const color = isDark ? "rgba(99, 102, 241, 0.7)" : "rgba(79, 70, 229, 0.6)";

      const cols = 10;
      const rows = 10;
      const spacingX = w / (cols + 1);
      const spacingY = h / (rows + 1);

      ctx.fillStyle = color;
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = spacingX * (col + 1);
          const y = spacingY * (row + 1);
          ctx.beginPath();
          ctx.arc(x, y, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };
    draw();
    // Redraw on resize
    const obs = new ResizeObserver(draw);
    obs.observe(cvs);
    return () => obs.disconnect();
  }, []);

  return <StepCanvas height={240} init={init} label="100 particles in a 10×10 grid — nothing fancy yet" />;
}

// ── Step 2: Random positions + animation loop ──
export function Step2Random() {
  const init = useCallback((ctx: CanvasRenderingContext2D, cvs: HTMLCanvasElement) => {
    const COUNT = 200;
    const px = new Float32Array(COUNT);
    const py = new Float32Array(COUNT);
    const seed = new Float32Array(COUNT);

    for (let i = 0; i < COUNT; i++) {
      px[i] = Math.random();
      py[i] = Math.random();
      seed[i] = Math.random() * Math.PI * 2;
    }

    let raf = 0;
    let dead = false;
    const startTime = performance.now();

    const draw = () => {
      if (dead) return;
      const rect = cvs.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      if (w === 0) { raf = requestAnimationFrame(draw); return; }

      const t = (performance.now() - startTime) / 1000;
      ctx.clearRect(0, 0, w, h);

      const isDark = document.documentElement.classList.contains("dark");

      for (let i = 0; i < COUNT; i++) {
        const floatX = Math.sin(t * 0.4 + seed[i]) * 8;
        const floatY = Math.cos(t * 0.3 + seed[i] * 1.3) * 6;
        const x = px[i] * w + floatX;
        const y = py[i] * h + floatY;
        const alpha = 0.3 + Math.sin(t * 0.5 + seed[i]) * 0.2;

        ctx.globalAlpha = alpha;
        ctx.fillStyle = isDark ? "rgb(99, 102, 241)" : "rgb(79, 70, 229)";
        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => { dead = true; cancelAnimationFrame(raf); };
  }, []);

  return <StepCanvas height={240} init={init} label="200 random particles with gentle floating — each has its own phase" />;
}

// ── Damping Graph: interactive spring response curve ──
export function DampingGraph() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [damping, setDamping] = useState(0.88);
  const [spring, setSpring] = useState(0.03);

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d")!;
    const dpr = Math.min(window.devicePixelRatio, 2);

    const rect = cvs.getBoundingClientRect();
    if (rect.width === 0) return;
    cvs.width = rect.width * dpr;
    cvs.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const w = rect.width;
    const h = rect.height;
    const isDark = document.documentElement.classList.contains("dark");

    const pad = { top: 24, right: 20, bottom: 36, left: 44 };
    const plotW = w - pad.left - pad.right;
    const plotH = h - pad.top - pad.bottom;

    ctx.clearRect(0, 0, w, h);

    // ── Grid lines ──
    ctx.strokeStyle = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (plotH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + plotW, y);
      ctx.stroke();
    }
    for (let i = 0; i <= 5; i++) {
      const x = pad.left + (plotW / 5) * i;
      ctx.beginPath();
      ctx.moveTo(x, pad.top);
      ctx.lineTo(x, pad.top + plotH);
      ctx.stroke();
    }

    // ── Axes ──
    ctx.strokeStyle = isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad.left, pad.top);
    ctx.lineTo(pad.left, pad.top + plotH);
    ctx.lineTo(pad.left + plotW, pad.top + plotH);
    ctx.stroke();

    // ── Axis labels ──
    ctx.fillStyle = isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)";
    ctx.font = "9px monospace";
    ctx.textAlign = "center";
    ctx.fillText("frames →", pad.left + plotW / 2, h - 4);
    ctx.textAlign = "right";
    // Y-axis ticks
    const yLabels = ["1.0", "0.75", "0.5", "0.25", "0"];
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (plotH / 4) * i;
      ctx.fillText(yLabels[i], pad.left - 6, y + 3);
    }
    // X-axis ticks
    ctx.textAlign = "center";
    const FRAMES = 120;
    for (let i = 0; i <= 5; i++) {
      const x = pad.left + (plotW / 5) * i;
      ctx.fillText(String(Math.round((FRAMES / 5) * i)), x, pad.top + plotH + 14);
    }

    // ── Target line (y=1) ──
    ctx.strokeStyle = isDark ? "rgba(99, 102, 241, 0.25)" : "rgba(79, 70, 229, 0.2)";
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    const targetY = pad.top;
    ctx.moveTo(pad.left, targetY);
    ctx.lineTo(pad.left + plotW, targetY);
    ctx.stroke();
    ctx.setLineDash([]);
    // Label
    ctx.fillStyle = isDark ? "rgba(99, 102, 241, 0.4)" : "rgba(79, 70, 229, 0.35)";
    ctx.font = "9px monospace";
    ctx.textAlign = "left";
    ctx.fillText("target", pad.left + plotW - 32, targetY - 5);

    // ── Simulate and draw comparison curves ──
    const configs = [
      { d: 0.80, s: spring, color: isDark ? "rgba(251, 191, 36, 0.6)" : "rgba(217, 119, 6, 0.5)", label: "0.80 (stiff)" },
      { d: damping, s: spring, color: isDark ? "rgba(99, 102, 241, 1)" : "rgba(79, 70, 229, 1)", label: `${damping.toFixed(2)} (current)`, active: true },
      { d: 0.95, s: spring, color: isDark ? "rgba(52, 211, 153, 0.6)" : "rgba(16, 185, 129, 0.5)", label: "0.95 (bouncy)" },
    ];

    // Don't draw 0.80 or 0.95 if current matches
    const filtered = configs.filter(c => c.active || Math.abs(c.d - damping) > 0.005);

    for (const config of filtered) {
      let pos = 0;
      let vel = 0;
      const target = 1;

      ctx.strokeStyle = config.color;
      ctx.lineWidth = config.active ? 2.5 : 1.5;
      ctx.globalAlpha = config.active ? 1 : 0.6;
      ctx.beginPath();

      for (let frame = 0; frame < FRAMES; frame++) {
        const dx = target - pos;
        vel += dx * config.s;
        vel *= config.d;
        pos += vel;

        const x = pad.left + (frame / FRAMES) * plotW;
        const y = pad.top + plotH - (pos * plotH);
        const clampedY = Math.max(pad.top - 4, Math.min(pad.top + plotH + 4, y));

        if (frame === 0) ctx.moveTo(x, clampedY);
        else ctx.lineTo(x, clampedY);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Label at end of curve
      let endPos = 0;
      let endVel = 0;
      for (let frame = 0; frame < FRAMES; frame++) {
        endVel += (1 - endPos) * config.s;
        endVel *= config.d;
        endPos += endVel;
      }
    }

    // ── Legend ──
    const legendX = pad.left + 8;
    let legendY = pad.top + 14;
    ctx.font = "9px monospace";

    for (const config of filtered) {
      ctx.fillStyle = config.color;
      ctx.fillRect(legendX, legendY - 4, 10, 2.5);
      ctx.fillStyle = isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.45)";
      ctx.textAlign = "left";
      ctx.fillText(config.label, legendX + 14, legendY);
      legendY += 14;
    }

    // ── "Position" Y-axis label (rotated) ──
    ctx.save();
    ctx.translate(10, pad.top + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)";
    ctx.font = "9px monospace";
    ctx.textAlign = "center";
    ctx.fillText("position", 0, 0);
    ctx.restore();

  }, [damping, spring]);

  // Handle resize
  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const obs = new ResizeObserver(() => {
      // Trigger re-render by touching state
      setDamping(d => d);
    });
    obs.observe(cvs);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      className="my-6 rounded-lg overflow-hidden"
      style={{ border: "1px solid var(--border)", background: "var(--code-bg)" }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: 220, display: "block" }}
      />
      <div
        className="px-4 py-3 space-y-2"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-mono flex justify-between" style={{ color: "var(--text-muted)" }}>
            <span>damping</span>
            <span style={{ opacity: 0.5 }}>{damping.toFixed(2)}</span>
          </span>
          <input
            type="range"
            min={0.5}
            max={0.99}
            step={0.01}
            value={damping}
            onChange={(e) => setDamping(parseFloat(e.target.value))}
            className="w-full h-1 appearance-none rounded"
            style={{ accentColor: "var(--accent)" }}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-mono flex justify-between" style={{ color: "var(--text-muted)" }}>
            <span>spring force</span>
            <span style={{ opacity: 0.5 }}>{spring.toFixed(3)}</span>
          </span>
          <input
            type="range"
            min={0.005}
            max={0.15}
            step={0.005}
            value={spring}
            onChange={(e) => setSpring(parseFloat(e.target.value))}
            className="w-full h-1 appearance-none rounded"
            style={{ accentColor: "var(--accent)" }}
          />
        </label>
      </div>
      <div
        className="px-3 py-2 text-[10px] font-mono"
        style={{ borderTop: "1px solid var(--border)", color: "var(--text-muted)", opacity: 0.6 }}
      >
        drag the sliders — watch how damping controls overshoot and settling time
      </div>
    </div>
  );
}

// ── Step 3: Spring physics — particles chase random targets ──
export function Step3Spring() {
  const init = useCallback((ctx: CanvasRenderingContext2D, cvs: HTMLCanvasElement) => {
    const COUNT = 200;
    const px = new Float32Array(COUNT);
    const py = new Float32Array(COUNT);
    const vx = new Float32Array(COUNT);
    const vy = new Float32Array(COUNT);
    const tx = new Float32Array(COUNT);
    const ty = new Float32Array(COUNT);

    const randomizeTargets = () => {
      for (let i = 0; i < COUNT; i++) {
        tx[i] = 0.15 + Math.random() * 0.7;
        ty[i] = 0.15 + Math.random() * 0.7;
      }
    };

    for (let i = 0; i < COUNT; i++) {
      px[i] = Math.random();
      py[i] = Math.random();
      vx[i] = 0;
      vy[i] = 0;
    }
    randomizeTargets();

    // Shuffle targets every 3 seconds
    const interval = setInterval(randomizeTargets, 3000);

    let raf = 0;
    let dead = false;

    const draw = () => {
      if (dead) return;
      const rect = cvs.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      if (w === 0) { raf = requestAnimationFrame(draw); return; }

      ctx.clearRect(0, 0, w, h);
      const isDark = document.documentElement.classList.contains("dark");

      for (let i = 0; i < COUNT; i++) {
        const dx = tx[i] - px[i];
        const dy = ty[i] - py[i];
        vx[i] += dx * 0.03;
        vy[i] += dy * 0.03;
        vx[i] *= 0.88;
        vy[i] *= 0.88;
        px[i] += vx[i];
        py[i] += vy[i];

        const dist = Math.sqrt(dx * dx + dy * dy);
        const alpha = Math.max(0.2, Math.min(0.8, 1 - dist * 3));
        ctx.globalAlpha = alpha;
        ctx.fillStyle = isDark ? "rgb(99, 102, 241)" : "rgb(79, 70, 229)";
        ctx.beginPath();
        ctx.arc(px[i] * w, py[i] * h, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => { dead = true; cancelAnimationFrame(raf); clearInterval(interval); };
  }, []);

  return <StepCanvas height={260} init={init} label="spring physics — particles chase new random targets every 3s (spring: 0.03, damping: 0.88)" />;
}

// ── Step 4: Arrange into a circle ──
export function Step4Circle() {
  const init = useCallback((ctx: CanvasRenderingContext2D, cvs: HTMLCanvasElement) => {
    const COUNT = 500;
    const px = new Float32Array(COUNT);
    const py = new Float32Array(COUNT);
    const vx = new Float32Array(COUNT);
    const vy = new Float32Array(COUNT);
    const tx = new Float32Array(COUNT);
    const ty = new Float32Array(COUNT);
    const seed = new Float32Array(COUNT);

    let isCircle = true;

    const setCircle = () => {
      for (let i = 0; i < COUNT; i++) {
        // Mix of edge + fill
        if (i < COUNT * 0.6) {
          const angle = (i / (COUNT * 0.6)) * Math.PI * 2;
          tx[i] = 0.5 + Math.cos(angle) * 0.3;
          ty[i] = 0.5 + Math.sin(angle) * 0.3;
        } else {
          const angle = Math.random() * Math.PI * 2;
          const r = Math.sqrt(Math.random()) * 0.28;
          tx[i] = 0.5 + Math.cos(angle) * r;
          ty[i] = 0.5 + Math.sin(angle) * r;
        }
      }
    };

    const setGrid = () => {
      const cols = 25;
      const rows = 20;
      for (let i = 0; i < COUNT; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        tx[i] = 0.1 + (col / (cols - 1)) * 0.8;
        ty[i] = 0.1 + (row / (rows - 1)) * 0.8;
      }
    };

    for (let i = 0; i < COUNT; i++) {
      px[i] = Math.random();
      py[i] = Math.random();
      vx[i] = 0;
      vy[i] = 0;
      seed[i] = Math.random() * Math.PI * 2;
    }
    setCircle();

    let raf = 0;
    let dead = false;
    const startTime = performance.now();

    const handleClick = () => {
      isCircle = !isCircle;
      if (isCircle) setCircle(); else setGrid();
      // Kick
      for (let i = 0; i < COUNT; i++) {
        vx[i] += (Math.random() - 0.5) * 0.02;
        vy[i] += (Math.random() - 0.5) * 0.02;
      }
    };

    cvs.addEventListener("click", handleClick);
    cvs.style.cursor = "pointer";

    const draw = () => {
      if (dead) return;
      const rect = cvs.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      if (w === 0) { raf = requestAnimationFrame(draw); return; }

      const t = (performance.now() - startTime) / 1000;
      ctx.clearRect(0, 0, w, h);
      const isDark = document.documentElement.classList.contains("dark");

      for (let i = 0; i < COUNT; i++) {
        const dx = tx[i] - px[i];
        const dy = ty[i] - py[i];
        vx[i] += dx * 0.03;
        vy[i] += dy * 0.03;
        vx[i] *= 0.88;
        vy[i] *= 0.88;
        px[i] += vx[i];
        py[i] += vy[i];

        const floatX = Math.sin(t * 0.3 + seed[i]) * 0.003;
        const floatY = Math.cos(t * 0.25 + seed[i] * 1.3) * 0.002;

        const dist = Math.sqrt(dx * dx + dy * dy);
        const alpha = Math.max(0.15, Math.min(0.8, 1 - dist * 3));
        ctx.globalAlpha = alpha;
        ctx.fillStyle = isDark ? "rgb(99, 102, 241)" : "rgb(79, 70, 229)";
        ctx.beginPath();
        ctx.arc((px[i] + floatX) * w, (py[i] + floatY) * h, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => { dead = true; cancelAnimationFrame(raf); cvs.removeEventListener("click", handleClick); };
  }, []);

  return <StepCanvas height={280} init={init} label="click to toggle between circle and grid — same physics, different targets" />;
}

// ── Step 5: Mouse repulsion ──
export function Step5Mouse() {
  const init = useCallback((ctx: CanvasRenderingContext2D, cvs: HTMLCanvasElement) => {
    const COUNT = 600;
    const px = new Float32Array(COUNT);
    const py = new Float32Array(COUNT);
    const vx = new Float32Array(COUNT);
    const vy = new Float32Array(COUNT);
    const tx = new Float32Array(COUNT);
    const ty = new Float32Array(COUNT);
    const seed = new Float32Array(COUNT);
    const psize = new Float32Array(COUNT);

    const mouse = { x: -9999, y: -9999 };

    // Heart shape
    for (let i = 0; i < COUNT; i++) {
      seed[i] = Math.random() * Math.PI * 2;
      psize[i] = 0.6 + Math.random() * 1.0;

      if (i < COUNT * 0.4) {
        // Edge
        const t = (i / (COUNT * 0.4)) * Math.PI * 2;
        const hx = 16 * Math.pow(Math.sin(t), 3);
        const hy = (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
        tx[i] = 0.5 + (hx / 18) * 0.3;
        ty[i] = 0.5 + (-hy / 18) * 0.3;
      } else {
        // Fill
        const t = Math.random() * Math.PI * 2;
        const s = Math.sqrt(Math.random()) * 0.9;
        const hx = 16 * Math.pow(Math.sin(t), 3) * s;
        const hy = (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * s;
        tx[i] = 0.5 + (hx / 18) * 0.3;
        ty[i] = 0.5 + (-hy / 18) * 0.3;
      }

      px[i] = (Math.random() - 0.5) * 0.5 + 0.5;
      py[i] = (Math.random() - 0.5) * 0.5 + 0.5;
      vx[i] = 0;
      vy[i] = 0;
    }

    const handleMouseMove = (e: MouseEvent) => {
      const rect = cvs.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    const handleMouseLeave = () => { mouse.x = -9999; mouse.y = -9999; };
    cvs.addEventListener("mousemove", handleMouseMove);
    cvs.addEventListener("mouseleave", handleMouseLeave);

    let raf = 0;
    let dead = false;
    const startTime = performance.now();

    const draw = () => {
      if (dead) return;
      const rect = cvs.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      if (w === 0) { raf = requestAnimationFrame(draw); return; }

      const t = (performance.now() - startTime) / 1000;
      ctx.clearRect(0, 0, w, h);
      const isDark = document.documentElement.classList.contains("dark");

      const REPEL_RADIUS = 50;
      const REPEL_FORCE = 0.08;

      for (let i = 0; i < COUNT; i++) {
        const screenX = px[i] * w;
        const screenY = py[i] * h;

        // Mouse repulsion
        const mdx = screenX - mouse.x;
        const mdy = screenY - mouse.y;
        const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mDist < REPEL_RADIUS && mDist > 0.1) {
          const force = (1 - mDist / REPEL_RADIUS) * REPEL_FORCE;
          vx[i] += (mdx / mDist) * force / w;
          vy[i] += (mdy / mDist) * force / h;
        }

        // Spring
        const dx = tx[i] - px[i];
        const dy = ty[i] - py[i];
        vx[i] += dx * 0.03;
        vy[i] += dy * 0.03;
        vx[i] *= 0.88;
        vy[i] *= 0.88;
        px[i] += vx[i];
        py[i] += vy[i];

        // Float
        const floatX = Math.sin(t * 0.3 + seed[i]) * 0.003;
        const floatY = Math.cos(t * 0.25 + seed[i] * 1.3) * 0.002;

        const dist = Math.sqrt(dx * dx + dy * dy);
        const alpha = Math.max(0.15, Math.min(0.85, 1 - dist * 3));
        ctx.globalAlpha = alpha;
        ctx.fillStyle = isDark
          ? `rgba(99, 102, 241, ${0.6 + Math.sin(t * 0.5 + seed[i]) * 0.15})`
          : `rgba(79, 70, 229, ${0.5 + Math.sin(t * 0.5 + seed[i]) * 0.15})`;
        ctx.beginPath();
        ctx.arc((px[i] + floatX) * w, (py[i] + floatY) * h, psize[i], 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      cvs.removeEventListener("mousemove", handleMouseMove);
      cvs.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return <StepCanvas height={300} init={init} label="hover to repel particles — the spring pulls them back" />;
}

// ── Step 6: SVG sampling demo ──
export function Step6SVG() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [svgText, setSvgText] = useState(
    "M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01z"
  );

  const particleState = useRef<{
    px: Float32Array;
    py: Float32Array;
    vx: Float32Array;
    vy: Float32Array;
    tx: Float32Array;
    ty: Float32Array;
    seed: Float32Array;
    psize: Float32Array;
    mouse: { x: number; y: number };
    dead: boolean;
    raf: number;
  } | null>(null);

  const samplePath = useCallback((pathData: string, count: number): [number, number][] => {
    try {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", "0 0 24 24");
      svg.style.position = "absolute";
      svg.style.left = "-9999px";
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", pathData);
      svg.appendChild(path);
      document.body.appendChild(svg);

      const len = path.getTotalLength();
      const bbox = path.getBBox();
      const pts: [number, number][] = [];

      // 60% edge, 40% fill
      const edgeCount = Math.floor(count * 0.6);
      for (let i = 0; i < edgeCount; i++) {
        const pt = path.getPointAtLength((i / edgeCount) * len);
        pts.push([pt.x, pt.y]);
      }

      // Interior fill via random sampling
      let attempts = 0;
      while (pts.length < count && attempts < count * 20) {
        const x = bbox.x + Math.random() * bbox.width;
        const y = bbox.y + Math.random() * bbox.height;
        // Check if inside by ray-casting approximation (use isPointInFill if available)
        const edgePt = path.getPointAtLength(Math.random() * len);
        const dx = x - edgePt.x;
        const dy = y - edgePt.y;
        if (Math.sqrt(dx * dx + dy * dy) < Math.max(bbox.width, bbox.height) * 0.4) {
          pts.push([x, y]);
        }
        attempts++;
      }
      // Fill remaining
      while (pts.length < count) {
        const pt = path.getPointAtLength(Math.random() * len);
        pts.push([pt.x + (Math.random() - 0.5) * 0.5, pt.y + (Math.random() - 0.5) * 0.5]);
      }

      document.body.removeChild(svg);

      // Normalize to 0..1
      const cx = bbox.x + bbox.width / 2;
      const cy = bbox.y + bbox.height / 2;
      const scale = Math.max(bbox.width, bbox.height) / 2;
      return pts.map(([x, y]) => [
        0.5 + ((x - cx) / scale) * 0.3,
        0.5 + ((y - cy) / scale) * 0.3,
      ]);
    } catch {
      // Fallback to circle
      return Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2;
        return [0.5 + Math.cos(angle) * 0.3, 0.5 + Math.sin(angle) * 0.3] as [number, number];
      });
    }
  }, []);

  const morphToPath = useCallback((pathData: string) => {
    const state = particleState.current;
    if (!state) return;
    const COUNT = state.px.length;
    const pts = samplePath(pathData, COUNT);
    for (let i = 0; i < COUNT; i++) {
      state.tx[i] = pts[i][0];
      state.ty[i] = pts[i][1];
      state.vx[i] += (Math.random() - 0.5) * 0.02;
      state.vy[i] += (Math.random() - 0.5) * 0.02;
    }
  }, [samplePath]);

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d")!;
    const dpr = Math.min(window.devicePixelRatio, 2);

    const resize = () => {
      const rect = cvs.getBoundingClientRect();
      if (rect.width === 0) return;
      cvs.width = rect.width * dpr;
      cvs.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const COUNT = 800;
    const px = new Float32Array(COUNT);
    const py = new Float32Array(COUNT);
    const vx = new Float32Array(COUNT);
    const vy = new Float32Array(COUNT);
    const tx = new Float32Array(COUNT);
    const ty = new Float32Array(COUNT);
    const seed = new Float32Array(COUNT);
    const psize = new Float32Array(COUNT);
    const mouse = { x: -9999, y: -9999 };

    const initPts = samplePath(svgText, COUNT);
    for (let i = 0; i < COUNT; i++) {
      px[i] = Math.random();
      py[i] = Math.random();
      vx[i] = 0;
      vy[i] = 0;
      tx[i] = initPts[i][0];
      ty[i] = initPts[i][1];
      seed[i] = Math.random() * Math.PI * 2;
      psize[i] = 0.6 + Math.random() * 0.8;
    }

    particleState.current = { px, py, vx, vy, tx, ty, seed, psize, mouse, dead: false, raf: 0 };
    const state = particleState.current;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = cvs.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    const handleMouseLeave = () => { mouse.x = -9999; mouse.y = -9999; };
    cvs.addEventListener("mousemove", handleMouseMove);
    cvs.addEventListener("mouseleave", handleMouseLeave);

    const startTime = performance.now();

    const draw = () => {
      if (state.dead) return;
      const rect = cvs.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      if (w === 0) { state.raf = requestAnimationFrame(draw); return; }

      const t = (performance.now() - startTime) / 1000;
      ctx.clearRect(0, 0, w, h);
      const isDark = document.documentElement.classList.contains("dark");

      for (let i = 0; i < COUNT; i++) {
        const screenX = px[i] * w;
        const screenY = py[i] * h;

        const mdx = screenX - mouse.x;
        const mdy = screenY - mouse.y;
        const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mDist < 40 && mDist > 0.1) {
          const force = (1 - mDist / 40) * 0.06;
          vx[i] += (mdx / mDist) * force / w;
          vy[i] += (mdy / mDist) * force / h;
        }

        const dx = tx[i] - px[i];
        const dy = ty[i] - py[i];
        vx[i] += dx * 0.03;
        vy[i] += dy * 0.03;
        vx[i] *= 0.88;
        vy[i] *= 0.88;
        px[i] += vx[i];
        py[i] += vy[i];

        const floatX = Math.sin(t * 0.3 + seed[i]) * 0.003;
        const floatY = Math.cos(t * 0.25 + seed[i] * 1.3) * 0.002;

        const dist = Math.sqrt(dx * dx + dy * dy);
        const alpha = Math.max(0.15, Math.min(0.85, 1 - dist * 3));
        ctx.globalAlpha = alpha;
        ctx.fillStyle = isDark
          ? `rgba(99, 102, 241, ${0.6 + Math.sin(t * 0.5 + seed[i]) * 0.15})`
          : `rgba(79, 70, 229, ${0.5 + Math.sin(t * 0.5 + seed[i]) * 0.15})`;
        ctx.beginPath();
        ctx.arc((px[i] + floatX) * w, (py[i] + floatY) * h, psize[i], 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      state.raf = requestAnimationFrame(draw);
    };

    state.raf = requestAnimationFrame(draw);
    return () => {
      state.dead = true;
      cancelAnimationFrame(state.raf);
      window.removeEventListener("resize", resize);
      cvs.removeEventListener("mousemove", handleMouseMove);
      cvs.removeEventListener("mouseleave", handleMouseLeave);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const presets: Record<string, string> = {
    star: "M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01z",
    heart: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",
    bolt: "M13 2L3 14h9l-1 10 10-12h-9l1-10z",
    circle: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z",
  };

  return (
    <div
      className="my-6 rounded-lg overflow-hidden"
      style={{ border: "1px solid var(--border)", background: "var(--code-bg)" }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: 300, display: "block", cursor: "crosshair" }}
      />
      <div className="px-3 py-3 space-y-2" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-wider opacity-50" style={{ color: "var(--text-muted)" }}>
            presets
          </span>
          {Object.keys(presets).map((key) => (
            <button
              key={key}
              onClick={() => { setSvgText(presets[key]); morphToPath(presets[key]); }}
              className="px-2 py-0.5 rounded text-[10px] font-mono transition-colors"
              style={{
                border: "1px solid var(--border)",
                background: "transparent",
                color: "var(--text-muted)",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--accent)"; e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "var(--accent)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.borderColor = "var(--border)"; }}
            >
              {key}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={svgText}
            onChange={(e) => setSvgText(e.target.value)}
            placeholder='paste svg path d="..." data'
            className="flex-1 px-2 py-1 rounded text-[10px] font-mono outline-none"
            style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
          />
          <button
            onClick={() => morphToPath(svgText)}
            className="px-2.5 py-1 rounded text-[10px] font-mono"
            style={{ background: "var(--accent)", color: "#fff", border: "none", cursor: "pointer" }}
          >
            morph
          </button>
        </div>
      </div>
      <div
        className="px-3 py-2 text-[10px] font-mono"
        style={{ borderTop: "1px solid var(--border)", color: "var(--text-muted)", opacity: 0.6 }}
      >
        paste any svg path data or pick a preset — particles morph to match
      </div>
    </div>
  );
}
