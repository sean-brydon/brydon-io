"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

// ── Shape definition types ──

export interface HeartShape {
  type: "heart";
}

export interface TextShape {
  type: "text";
  text: string;
  /** Font weight (default: 900) */
  fontWeight?: number;
  /** Font size in px for sampling canvas (default: 100) */
  fontSize?: number;
  /** Font family (default: "Arial, Helvetica, sans-serif") */
  fontFamily?: string;
}

export interface SVGShape {
  type: "svg";
  /** SVG path d-attribute string(s). Can be a single path or array of paths. */
  pathData: string | string[];
  /** viewBox dimensions [width, height] for normalizing. Default: auto from path bounds. */
  viewBox?: [number, number];
}

export type ShapeConfig = HeartShape | TextShape | SVGShape;

export interface ConfigurableParticlesProps {
  /** First shape (displayed initially) */
  shape1: ShapeConfig;
  /** Second shape (morphs to on click) */
  shape2: ShapeConfig;
  /** Number of particles (default: 2000) */
  particleCount?: number;
  /** Container height CSS value (default: "100%") */
  height?: string;
  /** Additional CSS class name */
  className?: string;
  /** Dark-mode particle color as [r, g, b] (default: [99, 102, 241] — indigo-500) */
  darkColor?: [number, number, number];
  /** Light-mode particle color as [r, g, b] (default: [79, 70, 229] — indigo-600) */
  lightColor?: [number, number, number];
  /** Whether clicking morphs between shapes (default: true) */
  clickToMorph?: boolean;
}

// ── Sampling functions ──

/**
 * Sample points from the parametric heart curve.
 * Returns points normalized to roughly -1..1 in screen-space (+y = down).
 */
function sampleHeart(): [number, number][] {
  const pts: [number, number][] = [];
  // Outline points
  for (let i = 0; i < 800; i++) {
    const t = (i / 800) * Math.PI * 2;
    const x = 16 * Math.pow(Math.sin(t), 3);
    // Standard heart formula gives y-up, so negate for screen coords (+y = down)
    const y =
      13 * Math.cos(t) -
      5 * Math.cos(2 * t) -
      2 * Math.cos(3 * t) -
      Math.cos(4 * t);
    pts.push([x / 18, -y / 18]);
  }
  // Fill points
  for (let i = 0; i < 1200; i++) {
    const t = Math.random() * Math.PI * 2;
    const s = Math.sqrt(Math.random()) * 0.92;
    const x = 16 * Math.pow(Math.sin(t), 3) * s;
    const y =
      (13 * Math.cos(t) -
        5 * Math.cos(2 * t) -
        2 * Math.cos(3 * t) -
        Math.cos(4 * t)) *
      s;
    pts.push([x / 18, -y / 18]);
  }
  return pts;
}

/**
 * Generalized text sampler — renders any text string onto a hidden canvas,
 * then samples pixel positions where alpha > 128.
 * Returns points normalized to -1..1 in screen-space.
 */
export function sampleText(
  text: string,
  fontWeight: number = 900,
  fontSize: number = 100,
  fontFamily: string = "Arial, Helvetica, sans-serif"
): [number, number][] {
  const tmp = document.createElement("canvas");
  const W = 400;
  const H = 200;
  tmp.width = W;
  tmp.height = H;
  const tc = tmp.getContext("2d")!;
  tc.fillStyle = "#fff";
  tc.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  tc.textAlign = "center";
  tc.textBaseline = "middle";
  tc.fillText(text, W / 2, H / 2);
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
}

/**
 * Sample points from SVG path data string(s).
 * Uses the browser's SVG path API (via an invisible SVG) to walk along
 * the path at regular intervals, then normalizes to -1..1.
 */
export function sampleSVG(
  pathData: string | string[],
  viewBox?: [number, number]
): [number, number][] {
  const paths = Array.isArray(pathData) ? pathData : [pathData];
  const allPts: [number, number][] = [];

  // Create a temporary SVG namespace element to get path geometry
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.style.position = "absolute";
  svg.style.left = "-9999px";
  svg.style.top = "-9999px";
  svg.style.width = "0";
  svg.style.height = "0";
  document.body.appendChild(svg);

  // Track bounding box across all paths
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  const rawPoints: [number, number][] = [];

  for (const d of paths) {
    const pathEl = document.createElementNS(svgNS, "path");
    pathEl.setAttribute("d", d);
    svg.appendChild(pathEl);

    const totalLen = pathEl.getTotalLength();
    // Sample ~1 point per unit length, minimum 200 per path
    const numSamples = Math.max(200, Math.floor(totalLen));

    for (let i = 0; i <= numSamples; i++) {
      const pt = pathEl.getPointAtLength((i / numSamples) * totalLen);
      rawPoints.push([pt.x, pt.y]);
      minX = Math.min(minX, pt.x);
      minY = Math.min(minY, pt.y);
      maxX = Math.max(maxX, pt.x);
      maxY = Math.max(maxY, pt.y);
    }

    svg.removeChild(pathEl);
  }

  document.body.removeChild(svg);

  if (rawPoints.length === 0) return [[0, 0]];

  // Normalize to -1..1 using viewBox or auto-detected bounds
  const bw = viewBox ? viewBox[0] : maxX - minX;
  const bh = viewBox ? viewBox[1] : maxY - minY;
  const bx = viewBox ? 0 : minX;
  const by = viewBox ? 0 : minY;
  const bmax = Math.max(bw, bh) || 1;

  for (const pt of rawPoints) {
    // Center and normalize to -1..1 maintaining aspect ratio
    const nx = ((pt[0] - bx - bw / 2) / (bmax / 2));
    const ny = ((pt[1] - by - bh / 2) / (bmax / 2));
    allPts.push([nx, ny]);
  }

  // Add fill points: sample random points inside the bounding area
  // Use a simple Monte Carlo approach with the path containment check
  // For simplicity, add jittered versions of outline points toward center
  const fillCount = Math.floor(rawPoints.length * 0.6);
  for (let i = 0; i < fillCount; i++) {
    const base = allPts[i % allPts.length];
    const shrink = Math.sqrt(Math.random()) * 0.85;
    allPts.push([base[0] * shrink, base[1] * shrink]);
  }

  return allPts;
}

/**
 * Sample points from a ShapeConfig.
 */
function sampleShape(config: ShapeConfig): [number, number][] {
  switch (config.type) {
    case "heart":
      return sampleHeart();
    case "text":
      return sampleText(
        config.text,
        config.fontWeight,
        config.fontSize,
        config.fontFamily
      );
    case "svg":
      return sampleSVG(config.pathData, config.viewBox);
  }
}

// ── Component ──

export function ConfigurableParticles({
  shape1,
  shape2,
  particleCount = 2000,
  height = "100%",
  className,
  darkColor = [99, 102, 241],
  lightColor = [79, 70, 229],
  clickToMorph = true,
}: ConfigurableParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { resolvedTheme } = useTheme();
  const themeRef = useRef(resolvedTheme);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const shapeRef = useRef<1 | 2>(1);

  // Keep props in refs so the animation loop always sees latest values
  const darkColorRef = useRef(darkColor);
  const lightColorRef = useRef(lightColor);
  darkColorRef.current = darkColor;
  lightColorRef.current = lightColor;

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

    const COUNT = particleCount;

    // Sample both shapes
    const shape1Pts = sampleShape(shape1);
    const shape2Pts = sampleShape(shape2);

    const getTargets = (which: 1 | 2): [number, number][] => {
      const src = which === 1 ? shape1Pts : shape2Pts;
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

    const initTargets = getTargets(1);
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

    const morphTo = (which: 1 | 2) => {
      const newTargets = getTargets(which);
      for (let i = 0; i < COUNT; i++) {
        tx[i] = newTargets[i][0];
        ty[i] = newTargets[i][1];
        vx[i] += (Math.random() - 0.5) * 0.02;
        vy[i] += (Math.random() - 0.5) * 0.02;
      }
    };

    const handleClick = () => {
      if (!clickToMorph) return;
      shapeRef.current = shapeRef.current === 1 ? 2 : 1;
      morphTo(shapeRef.current);
    };

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

    // ── Physics constants (same as original) ──
    const SPRING_K = 0.03;
    const DAMPING = 0.88;
    const REPEL_RADIUS = 20;
    const REPEL_FORCE = 0.08;

    const draw = () => {
      if (dead) return;
      const rect = cvs.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      if (w === 0 || h === 0) {
        raf = requestAnimationFrame(draw);
        return;
      }
      const t = (performance.now() - startTime) / 1000;

      ctx.clearRect(0, 0, w, h);

      const isDark = themeRef.current === "dark";
      const scale = Math.min(w, h) * 0.3;
      const cx = w / 2;
      const cy = h / 2;

      const mouse = mouseRef.current;
      const dc = darkColorRef.current;
      const lc = lightColorRef.current;

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
        vx[i] += dx * SPRING_K;
        vy[i] += dy * SPRING_K;

        // Damping
        vx[i] *= DAMPING;
        vy[i] *= DAMPING;

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
          ctx.fillStyle = `rgba(${dc[0]}, ${dc[1]}, ${dc[2]}, ${0.6 + Math.sin(t * 0.5 + s) * 0.15})`;
        } else {
          ctx.globalAlpha = alpha * 0.9;
          ctx.fillStyle = `rgba(${lc[0]}, ${lc[1]}, ${lc[2]}, ${0.5 + Math.sin(t * 0.5 + s) * 0.15})`;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shape1, shape2, particleCount, clickToMorph]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        width: "100%",
        height,
        display: "block",
        cursor: clickToMorph ? "pointer" : "default",
      }}
    />
  );
}
