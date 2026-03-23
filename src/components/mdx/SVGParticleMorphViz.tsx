"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// ── Preset SVG paths ──
const PRESETS: Record<string, string> = {
  star: "M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01z",
  heart:
    "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",
  bolt: "M13 2L3 14h9l-1 10 10-12h-9l1-10z",
  circle: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z",
};

// ── Sample points from an SVG path ──
function sampleSVGPath(
  pathData: string,
  count: number
): [number, number][] {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", pathData);
  svg.appendChild(path);
  document.body.appendChild(svg);

  const len = path.getTotalLength();
  const pts: [number, number][] = [];

  // Edge samples (60%)
  const edgeCount = Math.floor(count * 0.6);
  for (let i = 0; i < edgeCount; i++) {
    const pt = path.getPointAtLength((i / edgeCount) * len);
    pts.push([pt.x, pt.y]);
  }

  // Interior fill (40%) - use bounding box + point-in-path approximation
  const bbox = path.getBBox();
  const fillCount = count - edgeCount;
  let attempts = 0;
  while (pts.length < count && attempts < fillCount * 10) {
    const x = bbox.x + Math.random() * bbox.width;
    const y = bbox.y + Math.random() * bbox.height;
    // Simple interior check: find nearest edge point and add with jitter
    const nearestEdge = path.getPointAtLength(
      ((Math.random() * edgeCount) / edgeCount) * len
    );
    const dx = x - nearestEdge.x;
    const dy = y - nearestEdge.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < Math.max(bbox.width, bbox.height) * 0.5) {
      pts.push([x, y]);
    }
    attempts++;
  }

  // Fill remaining with edge jitter if needed
  while (pts.length < count) {
    const pt = path.getPointAtLength(Math.random() * len);
    pts.push([
      pt.x + (Math.random() - 0.5) * 0.5,
      pt.y + (Math.random() - 0.5) * 0.5,
    ]);
  }

  document.body.removeChild(svg);

  // Normalize to -1..1
  const cx = bbox.x + bbox.width / 2;
  const cy = bbox.y + bbox.height / 2;
  const scale = Math.max(bbox.width, bbox.height) / 2;
  return pts.map(([x, y]) => [
    (x - cx) / scale,
    (y - cy) / scale,
  ]);
}

// ── Sample from text (reuses the pattern from particles.tsx) ──
function sampleText(text: string, count: number): [number, number][] {
  const tmp = document.createElement("canvas");
  const W = 400;
  const H = 200;
  tmp.width = W;
  tmp.height = H;
  const tc = tmp.getContext("2d")!;
  tc.fillStyle = "#fff";
  tc.font = "900 100px Arial, Helvetica, sans-serif";
  tc.textAlign = "center";
  tc.textBaseline = "middle";
  tc.fillText(text, W / 2, H / 2);
  const img = tc.getImageData(0, 0, W, H);
  const raw: [number, number][] = [];
  for (let y = 0; y < H; y += 2) {
    for (let x = 0; x < W; x += 2) {
      if (img.data[(y * W + x) * 4 + 3] > 128) {
        raw.push([(x / W) * 2 - 1, (y / H) * 2 - 1]);
      }
    }
  }
  const pts: [number, number][] = [];
  for (let i = 0; i < count; i++) {
    const pt = raw[i % raw.length];
    pts.push([
      pt[0] + (Math.random() - 0.5) * 0.02,
      pt[1] + (Math.random() - 0.5) * 0.02,
    ]);
  }
  return pts;
}

interface PhysicsConfig {
  spring: number;
  damping: number;
  repelRadius: number;
  repelForce: number;
  floatAmount: number;
  particleCount: number;
}

const DEFAULT_PHYSICS: PhysicsConfig = {
  spring: 0.03,
  damping: 0.88,
  repelRadius: 20,
  repelForce: 0.08,
  floatAmount: 0.006,
  particleCount: 1500,
};

// ── Main interactive viz ──
export default function SVGParticleMorphViz() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const physicsRef = useRef<PhysicsConfig>({ ...DEFAULT_PHYSICS });
  const morphTrigger = useRef<[number, number][] | null>(null);
  const [activePreset, setActivePreset] = useState<string>("star");
  const [physics, setPhysics] = useState<PhysicsConfig>({ ...DEFAULT_PHYSICS });
  const [showCode, setShowCode] = useState(false);
  const [customSvg, setCustomSvg] = useState("");

  // Keep ref in sync
  useEffect(() => {
    physicsRef.current = physics;
  }, [physics]);

  const morphTo = useCallback(
    (pts: [number, number][]) => {
      morphTrigger.current = pts;
    },
    []
  );

  const handlePreset = useCallback(
    (key: string) => {
      setActivePreset(key);
      const pts = sampleSVGPath(PRESETS[key], physics.particleCount);
      morphTo(pts);
    },
    [morphTo, physics.particleCount]
  );

  const handleCustomSvg = useCallback(() => {
    if (!customSvg.trim()) return;
    try {
      // Extract d attribute from SVG path
      let pathData = customSvg.trim();
      const match = pathData.match(/d="([^"]+)"/);
      if (match) pathData = match[1];
      const pts = sampleSVGPath(pathData, physics.particleCount);
      setActivePreset("custom");
      morphTo(pts);
    } catch (e) {
      console.error("invalid svg path:", e);
    }
  }, [customSvg, morphTo, physics.particleCount]);

  const handleTextMorph = useCallback(() => {
    const pts = sampleText("HI", physics.particleCount);
    setActivePreset("text");
    morphTo(pts);
  }, [morphTo, physics.particleCount]);

  // ── Canvas animation loop ──
  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d")!;
    const dpr = Math.min(window.devicePixelRatio, 2);
    let raf = 0;
    let dead = false;
    const COUNT = physicsRef.current.particleCount;

    const px = new Float32Array(COUNT);
    const py = new Float32Array(COUNT);
    const vx = new Float32Array(COUNT);
    const vy = new Float32Array(COUNT);
    const tx = new Float32Array(COUNT);
    const ty = new Float32Array(COUNT);
    const seed = new Float32Array(COUNT);
    const psize = new Float32Array(COUNT);

    // Initialize with star
    const initPts = sampleSVGPath(PRESETS.star, COUNT);
    for (let i = 0; i < COUNT; i++) {
      px[i] = (Math.random() - 0.5) * 3;
      py[i] = (Math.random() - 0.5) * 3;
      vx[i] = 0;
      vy[i] = 0;
      tx[i] = initPts[i][0];
      ty[i] = initPts[i][1];
      seed[i] = Math.random() * Math.PI * 2;
      psize[i] = 0.6 + Math.random() * 0.8;
    }

    const resize = () => {
      const r = cvs.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      cvs.width = r.width * dpr;
      cvs.height = r.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = cvs.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };
    const handleMouseLeave = () => {
      mouseRef.current = { x: -9999, y: -9999 };
    };
    cvs.addEventListener("mousemove", handleMouseMove);
    cvs.addEventListener("mouseleave", handleMouseLeave);

    const startTime = performance.now();

    const draw = () => {
      if (dead) return;
      const r = cvs.getBoundingClientRect();
      const w = r.width;
      const h = r.height;
      if (w === 0 || h === 0) {
        raf = requestAnimationFrame(draw);
        return;
      }
      const t = (performance.now() - startTime) / 1000;
      const p = physicsRef.current;

      // Check for morph trigger
      if (morphTrigger.current) {
        const newPts = morphTrigger.current;
        for (let i = 0; i < COUNT; i++) {
          const pt = newPts[i % newPts.length];
          tx[i] = pt[0] + (Math.random() - 0.5) * 0.02;
          ty[i] = pt[1] + (Math.random() - 0.5) * 0.02;
          vx[i] += (Math.random() - 0.5) * 0.04;
          vy[i] += (Math.random() - 0.5) * 0.04;
        }
        morphTrigger.current = null;
      }

      ctx.clearRect(0, 0, w, h);

      const isDark =
        document.documentElement.classList.contains("dark");
      const scale = Math.min(w, h) * 0.32;
      const cx = w / 2;
      const cy = h / 2;

      const mouse = mouseRef.current;

      for (let i = 0; i < COUNT; i++) {
        const screenX = cx + px[i] * scale;
        const screenY = cy + py[i] * scale;

        // Mouse repulsion
        const mdx = screenX - mouse.x;
        const mdy = screenY - mouse.y;
        const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mDist < p.repelRadius && mDist > 0.1) {
          const force =
            (1 - mDist / p.repelRadius) * p.repelForce;
          vx[i] += (mdx / mDist) * force;
          vy[i] += (mdy / mDist) * force;
        }

        // Spring
        const dx = tx[i] - px[i];
        const dy = ty[i] - py[i];
        vx[i] += dx * p.spring;
        vy[i] += dy * p.spring;

        // Damping
        vx[i] *= p.damping;
        vy[i] *= p.damping;

        px[i] += vx[i];
        py[i] += vy[i];

        // Float
        const s = seed[i];
        const floatX =
          Math.sin(t * 0.3 + s) * p.floatAmount;
        const floatY =
          Math.cos(t * 0.25 + s * 1.3) * (p.floatAmount * 0.67);

        const finalX = cx + (px[i] + floatX) * scale;
        const finalY = cy + (py[i] + floatY) * scale;

        const dist = Math.sqrt(dx * dx + dy * dy);
        const alpha = Math.max(
          0.15,
          Math.min(0.85, 1 - dist * 2)
        );

        const sz = psize[i];
        if (isDark) {
          ctx.globalAlpha = alpha;
          ctx.fillStyle = `rgba(99, 102, 241, ${
            0.6 + Math.sin(t * 0.5 + s) * 0.15
          })`;
        } else {
          ctx.globalAlpha = alpha * 0.9;
          ctx.fillStyle = `rgba(79, 70, 229, ${
            0.5 + Math.sin(t * 0.5 + s) * 0.15
          })`;
        }
        ctx.beginPath();
        ctx.arc(finalX, finalY, sz, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);

    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      cvs.removeEventListener("mousemove", handleMouseMove);
      cvs.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [physics.particleCount]);

  const generatedCode = `const COUNT = ${physics.particleCount};
const SPRING = ${physics.spring};
const DAMPING = ${physics.damping};
const REPEL_RADIUS = ${physics.repelRadius};
const REPEL_FORCE = ${physics.repelForce};
const FLOAT = ${physics.floatAmount};

// particle state (Float32Arrays for perf)
const px = new Float32Array(COUNT);
const py = new Float32Array(COUNT);
const vx = new Float32Array(COUNT);
const vy = new Float32Array(COUNT);
const tx = new Float32Array(COUNT); // targets
const ty = new Float32Array(COUNT);

function tick(mouse) {
  for (let i = 0; i < COUNT; i++) {
    // spring to target
    vx[i] += (tx[i] - px[i]) * SPRING;
    vy[i] += (ty[i] - py[i]) * SPRING;

    // mouse repulsion
    const dx = px[i] * scale + cx - mouse.x;
    const dy = py[i] * scale + cy - mouse.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d < REPEL_RADIUS && d > 0.1) {
      const f = (1 - d / REPEL_RADIUS) * REPEL_FORCE;
      vx[i] += (dx / d) * f;
      vy[i] += (dy / d) * f;
    }

    // damping + integrate
    vx[i] *= DAMPING;
    vy[i] *= DAMPING;
    px[i] += vx[i];
    py[i] += vy[i];
  }
}`;

  return (
    <div
      className="my-8 rounded-lg overflow-hidden"
      style={{
        border: "1px solid var(--border)",
        background: "var(--code-bg)",
      }}
    >
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: 320, display: "block", cursor: "crosshair" }}
      />

      {/* Controls */}
      <div
        className="px-4 py-3 space-y-3"
        style={{
          borderTop: "1px solid var(--border)",
          color: "var(--text-muted)",
        }}
      >
        {/* Shape presets */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider opacity-50 mr-1">
            shape
          </span>
          {Object.keys(PRESETS).map((key) => (
            <button
              key={key}
              onClick={() => handlePreset(key)}
              className="px-2.5 py-1 rounded text-[11px] font-mono transition-colors"
              style={{
                background:
                  activePreset === key
                    ? "var(--accent)"
                    : "transparent",
                color:
                  activePreset === key
                    ? "#fff"
                    : "var(--text-muted)",
                border: `1px solid ${
                  activePreset === key
                    ? "var(--accent)"
                    : "var(--border)"
                }`,
              }}
            >
              {key}
            </button>
          ))}
          <button
            onClick={handleTextMorph}
            className="px-2.5 py-1 rounded text-[11px] font-mono transition-colors"
            style={{
              background:
                activePreset === "text"
                  ? "var(--accent)"
                  : "transparent",
              color:
                activePreset === "text"
                  ? "#fff"
                  : "var(--text-muted)",
              border: `1px solid ${
                activePreset === "text"
                  ? "var(--accent)"
                  : "var(--border)"
              }`,
            }}
          >
            text
          </button>
        </div>

        {/* Custom SVG input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={customSvg}
            onChange={(e) => setCustomSvg(e.target.value)}
            placeholder='paste svg path d="..." here'
            className="flex-1 px-2 py-1 rounded text-[11px] font-mono outline-none"
            style={{
              background: "var(--bg)",
              border: "1px solid var(--border)",
              color: "var(--text)",
            }}
          />
          <button
            onClick={handleCustomSvg}
            className="px-3 py-1 rounded text-[11px] font-mono"
            style={{
              background: "var(--accent)",
              color: "#fff",
              border: "none",
            }}
          >
            morph
          </button>
        </div>

        {/* Physics sliders */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
          {[
            { key: "spring" as const, label: "spring", min: 0.005, max: 0.12, step: 0.005 },
            { key: "damping" as const, label: "damping", min: 0.7, max: 0.98, step: 0.01 },
            { key: "repelRadius" as const, label: "repel ∅", min: 0, max: 80, step: 1 },
            { key: "repelForce" as const, label: "repel force", min: 0, max: 0.3, step: 0.01 },
            { key: "floatAmount" as const, label: "float", min: 0, max: 0.02, step: 0.001 },
          ].map(({ key, label, min, max, step }) => (
            <label key={key} className="flex flex-col gap-0.5">
              <span className="text-[10px] font-mono flex justify-between">
                <span>{label}</span>
                <span className="opacity-50">{physics[key]}</span>
              </span>
              <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={physics[key]}
                onChange={(e) =>
                  setPhysics((p) => ({
                    ...p,
                    [key]: parseFloat(e.target.value),
                  }))
                }
                className="w-full h-1 appearance-none rounded"
                style={{ accentColor: "var(--accent)" }}
              />
            </label>
          ))}
        </div>

        {/* Export / Reset */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => setShowCode(!showCode)}
            className="px-2.5 py-1 rounded text-[10px] font-mono"
            style={{
              border: "1px solid var(--border)",
              background: showCode ? "var(--accent)" : "transparent",
              color: showCode ? "#fff" : "var(--text-muted)",
            }}
          >
            {showCode ? "hide code" : "export code"}
          </button>
          <button
            onClick={() => {
              setPhysics({ ...DEFAULT_PHYSICS });
              handlePreset("star");
            }}
            className="px-2.5 py-1 rounded text-[10px] font-mono"
            style={{
              border: "1px solid var(--border)",
              background: "transparent",
              color: "var(--text-muted)",
            }}
          >
            reset
          </button>
        </div>

        {/* Code export */}
        {showCode && (
          <pre
            className="text-[10px] leading-relaxed p-3 rounded overflow-x-auto font-mono"
            style={{
              background: "var(--bg)",
              border: "1px solid var(--border)",
              color: "var(--text-muted)",
            }}
          >
            {generatedCode}
          </pre>
        )}
      </div>

      <div
        className="px-3 py-2 text-[10px]"
        style={{
          borderTop: "1px solid var(--border)",
          color: "var(--text-muted)",
        }}
      >
        move your cursor over the particles — pick a shape or paste your own svg path
      </div>
    </div>
  );
}
