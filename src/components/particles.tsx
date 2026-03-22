"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

export function Particles({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { resolvedTheme } = useTheme();
  const themeRef = useRef(resolvedTheme);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const shapeRef = useRef<"heart" | "sb">("heart");

  useEffect(() => {
    themeRef.current = resolvedTheme;
  }, [resolvedTheme]);

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d")!;
    const dpr = Math.min(window.devicePixelRatio, 2);
    let raf = 0;
    let dead = false;

    const COUNT = 2000;

    // ── Heart: parametric formula ──
    // Uses screen-space convention: +y = down
    const sampleHeart = (): [number, number][] => {
      const pts: [number, number][] = [];
      for (let i = 0; i < 800; i++) {
        const t = (i / 800) * Math.PI * 2;
        const x = 16 * Math.pow(Math.sin(t), 3);
        // Standard heart formula gives y-up, so negate for screen coords (+y = down)
        const y = (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
        pts.push([x / 18, -y / 18]);
      }
      for (let i = 0; i < 1200; i++) {
        const t = Math.random() * Math.PI * 2;
        const s = Math.sqrt(Math.random()) * 0.92;
        const x = 16 * Math.pow(Math.sin(t), 3) * s;
        const y = (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * s;
        pts.push([x / 18, -y / 18]);
      }
      return pts;
    };

    // ── SB: sample from hidden canvas ──
    // Uses screen-space convention: +y = down (no Y flip)
    const sampleSB = (): [number, number][] => {
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
      tc.fillText("S B", W / 2, H / 2);
      const img = tc.getImageData(0, 0, W, H);
      const pts: [number, number][] = [];
      for (let y = 0; y < H; y += 2) {
        for (let x = 0; x < W; x += 2) {
          if (img.data[(y * W + x) * 4 + 3] > 128) {
            // Map to -1..1, keeping canvas orientation (no Y flip)
            pts.push([(x / W) * 2 - 1, (y / H) * 2 - 1]);
          }
        }
      }
      return pts;
    };

    const heartPts = sampleHeart();
    const sbPts = sampleSB();

    const getTargets = (shape: "heart" | "sb"): [number, number][] => {
      const src = shape === "heart" ? heartPts : sbPts;
      const targets: [number, number][] = [];
      for (let i = 0; i < COUNT; i++) {
        const pt = src[i % src.length];
        targets.push([
          pt[0] + (Math.random() - 0.5) * 0.03,
          pt[1] + (Math.random() - 0.5) * 0.03,
        ]);
      }
      return targets;
    };

    // Particle state
    const px = new Float32Array(COUNT);
    const py = new Float32Array(COUNT);
    const vx = new Float32Array(COUNT);
    const vy = new Float32Array(COUNT);
    const tx = new Float32Array(COUNT);
    const ty = new Float32Array(COUNT);
    const seed = new Float32Array(COUNT);
    const psize = new Float32Array(COUNT);

    const initTargets = getTargets("heart");
    for (let i = 0; i < COUNT; i++) {
      px[i] = (Math.random() - 0.5) * 3;
      py[i] = (Math.random() - 0.5) * 3;
      vx[i] = 0;
      vy[i] = 0;
      tx[i] = initTargets[i][0];
      ty[i] = initTargets[i][1];
      seed[i] = Math.random() * Math.PI * 2;
      psize[i] = 0.8 + Math.random() * 1.0;
    }

    const morphTo = (shape: "heart" | "sb") => {
      const newTargets = getTargets(shape);
      for (let i = 0; i < COUNT; i++) {
        tx[i] = newTargets[i][0];
        ty[i] = newTargets[i][1];
        vx[i] += (Math.random() - 0.5) * 0.02;
        vy[i] += (Math.random() - 0.5) * 0.02;
      }
    };

    const handleClick = () => {
      shapeRef.current = shapeRef.current === "heart" ? "sb" : "heart";
      morphTo(shapeRef.current);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = cvs.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: -9999, y: -9999 };
    };

    cvs.addEventListener("click", handleClick);
    cvs.addEventListener("mousemove", handleMouseMove);
    cvs.addEventListener("mouseleave", handleMouseLeave);

    const resize = () => {
      const rect = cvs.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      cvs.width = rect.width * dpr;
      cvs.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    // Retry resize until container has dimensions
    const ensureSize = () => {
      resize();
      if (cvs.width === 0 && !dead) {
        requestAnimationFrame(ensureSize);
      }
    };
    ensureSize();
    window.addEventListener("resize", resize);

    const startTime = performance.now();

    const draw = () => {
      if (dead) return;
      const rect = cvs.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      if (w === 0 || h === 0) { raf = requestAnimationFrame(draw); return; }
      const t = (performance.now() - startTime) / 1000;

      ctx.clearRect(0, 0, w, h);

      const isDark = themeRef.current === "dark";
      const scale = Math.min(w, h) * 0.3;
      const cx = w / 2;
      const cy = h / 2;

      const mouse = mouseRef.current;
      const REPEL_RADIUS = 20;
      const REPEL_FORCE = 0.08;

      for (let i = 0; i < COUNT; i++) {
        // Screen position: cx/cy is center, +x=right, +y=down (screen convention)
        const screenX = cx + px[i] * scale;
        const screenY = cy + py[i] * scale;

        // Mouse repulsion
        const mdx = screenX - mouse.x;
        const mdy = screenY - mouse.y;
        const mDist = Math.sqrt(mdx * mdx + mdy * mdy);

        if (mDist < REPEL_RADIUS && mDist > 0.1) {
          const force = (1 - mDist / REPEL_RADIUS) * REPEL_FORCE;
          vx[i] += (mdx / mDist) * force;
          vy[i] += (mdy / mDist) * force;
        }

        // Spring back to target
        const dx = tx[i] - px[i];
        const dy = ty[i] - py[i];
        vx[i] += dx * 0.03;
        vy[i] += dy * 0.03;

        // Damping
        vx[i] *= 0.88;
        vy[i] *= 0.88;

        px[i] += vx[i];
        py[i] += vy[i];

        // Gentle float
        const s = seed[i];
        const floatX = Math.sin(t * 0.3 + s) * 0.006;
        const floatY = Math.cos(t * 0.25 + s * 1.3) * 0.004;

        const finalX = cx + (px[i] + floatX) * scale;
        const finalY = cy + (py[i] + floatY) * scale;

        const dist = Math.sqrt(dx * dx + dy * dy);
        const alpha = Math.max(0.15, Math.min(0.85, 1 - dist * 2));

        const r = psize[i];
        if (isDark) {
          ctx.globalAlpha = alpha;
          ctx.fillStyle = `rgba(99, 102, 241, ${0.6 + Math.sin(t * 0.5 + s) * 0.15})`;
        } else {
          ctx.globalAlpha = alpha * 0.9;
          ctx.fillStyle = `rgba(79, 70, 229, ${0.5 + Math.sin(t * 0.5 + s) * 0.15})`;
        }
        ctx.beginPath();
        ctx.arc(finalX, finalY, r, 0, Math.PI * 2);
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
      cvs.removeEventListener("click", handleClick);
      cvs.removeEventListener("mousemove", handleMouseMove);
      cvs.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: "100%", height: "100%", display: "block", cursor: "pointer" }}
    />
  );
}
