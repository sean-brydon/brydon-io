"use client";

import { useCallback, useEffect, useRef } from "react";
import { Polaroid } from "@/components/polaroid";
import type { Photo } from "@/lib/photos";

/** Where a photo enters the table from. Coordinates are relative to `rootRef`. */
export type Spawn =
  | { kind: "print"; x: number; y: number }
  | { kind: "drop" }
  | { kind: "scatter" };

type Drag = {
  pointerId: number;
  // Grab point in the card's local (unrotated) frame, relative to its center.
  lx: number;
  ly: number;
  px: number;
  py: number;
  pvx: number;
  pvy: number;
  lastMove: number;
};

type Body = {
  el: HTMLElement;
  w: number;
  h: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  a: number;
  va: number;
  scale: number;
  drag: Drag | null;
};

type Rect = { left: number; top: number; right: number; bottom: number };

const FRICTION = 0.92; // per 60fps frame
const SPIN_FRICTION = 0.9;
const DRAG_SPIN_FRICTION = 0.82;
const WALL_SPRING = 0.015;
const AVOID_SPRING = 0.02;
const CONTACT_DAMPING = 0.9;
const MAX_THROW = 70;

function hash(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++)
    h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Small seeded PRNG so a photo's resting spot is stable across reloads. */
function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function inside(x: number, y: number, r: Rect) {
  return x > r.left && x < r.right && y > r.top && y < r.bottom;
}

function expand(r: Rect, dx: number, dy: number): Rect {
  return {
    left: r.left - dx,
    top: r.top - dy,
    right: r.right + dx,
    bottom: r.bottom + dy,
  };
}

/** A resting spot on the table that isn't under the camera or controls. */
function randomSpot(
  bounds: Rect,
  avoid: Rect[],
  w: number,
  h: number,
  rand: () => number,
) {
  const padX = Math.min(w * 0.45, (bounds.right - bounds.left) / 2);
  const padY = Math.min(h * 0.45, (bounds.bottom - bounds.top) / 2);
  const zones = avoid.map((r) => expand(r, w * 0.55, h * 0.55));
  let spot = { x: 0, y: 0 };
  for (let i = 0; i < 24; i++) {
    spot = {
      x:
        bounds.left +
        padX +
        rand() * Math.max(0, bounds.right - bounds.left - padX * 2),
      y:
        bounds.top +
        padY +
        rand() * Math.max(0, bounds.bottom - bounds.top - padY * 2),
    };
    if (!zones.some((z) => inside(spot.x, spot.y, z))) break;
  }
  return spot;
}

export function PolaroidGallery({
  photos,
  loaded,
  spawns,
  rootRef,
  avoidRefs,
}: {
  photos: Photo[];
  /** Whether the stored photos have arrived. Until then, anything we get is scattered, not dropped in. */
  loaded: boolean;
  /** How photos we've been told about entered. Unknown photos scatter on first load, drop in after. */
  spawns: Map<string, Spawn>;
  /** The table: cards are kept inside it. Coordinates are relative to it. */
  rootRef: React.RefObject<HTMLElement | null>;
  /** Cards get nudged out from under these elements (camera, controls). */
  avoidRefs: React.RefObject<HTMLElement | null>[];
}) {
  const bodies = useRef(new Map<string, Body>());
  const zTop = useRef(1);
  const settled = useRef(false);

  // Effects run after that commit's ref callbacks, so only the initial pile scatters.
  useEffect(() => {
    if (loaded) settled.current = true;
  }, [loaded]);

  const avoidRefsRef = useRef(avoidRefs);
  useEffect(() => {
    avoidRefsRef.current = avoidRefs;
  });

  const getTable = useCallback((): { bounds: Rect; avoid: Rect[] } | null => {
    const root = rootRef.current?.getBoundingClientRect();
    if (!root) return null;
    const avoid: Rect[] = [];
    for (const ref of avoidRefsRef.current) {
      const box = ref.current?.getBoundingClientRect();
      if (!box || !box.width || !box.height) continue; // e.g. display: none on small screens
      avoid.push({
        left: box.left - root.left,
        top: box.top - root.top,
        right: box.right - root.left,
        bottom: box.bottom - root.top,
      });
    }
    return {
      bounds: { left: 0, top: 0, right: root.width, bottom: root.height },
      avoid,
    };
  }, [rootRef]);

  const toRoot = useCallback(
    (e: PointerEvent) => {
      const root = rootRef.current!.getBoundingClientRect();
      return { x: e.clientX - root.left, y: e.clientY - root.top };
    },
    [rootRef],
  );

  // Single animation loop for every card.
  useEffect(() => {
    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const k = Math.min(now - last, 50) / (1000 / 60);
      last = now;
      const table = getTable();

      for (const b of bodies.current.values()) {
        if (b.drag) {
          const d = b.drag;
          // The card hangs off the grab point. Air drag on the center creates
          // torque that swings the card to trail behind the pointer.
          const cos = Math.cos(b.a);
          const sin = Math.sin(b.a);
          const rx = -(d.lx * cos - d.ly * sin);
          const ry = -(d.lx * sin + d.ly * cos);
          const torque = (rx * -d.pvy - ry * -d.pvx) * 0.000012;
          b.va = (b.va + torque * k) * DRAG_SPIN_FRICTION ** k;
          b.a += b.va * k;
          const c2 = Math.cos(b.a);
          const s2 = Math.sin(b.a);
          b.x = d.px - (d.lx * c2 - d.ly * s2);
          b.y = d.py - (d.lx * s2 + d.ly * c2);
          d.pvx *= 0.85 ** k; // decays unless the pointer keeps moving
          d.pvy *= 0.85 ** k;
        } else {
          b.x += b.vx * k;
          b.y += b.vy * k;
          b.a += b.va * k;
          b.vx *= FRICTION ** k;
          b.vy *= FRICTION ** k;
          b.va *= SPIN_FRICTION ** k;

          if (table) {
            const { bounds, avoid } = table;
            // Soft walls: cards may poke out a little, then get pulled back in.
            const minX = bounds.left + b.w * 0.3;
            const maxX = bounds.right - b.w * 0.3;
            const minY = bounds.top + b.h * 0.3;
            const maxY = bounds.bottom - b.h * 0.3;
            if (b.x < minX) b.vx += (minX - b.x) * WALL_SPRING * k;
            if (b.x > maxX) b.vx += (maxX - b.x) * WALL_SPRING * k;
            if (b.y < minY) b.vy += (minY - b.y) * WALL_SPRING * k;
            if (b.y > maxY) b.vy += (maxY - b.y) * WALL_SPRING * k;

            // Slide out from under the camera and controls, away from their centers.
            for (const r of avoid) {
              // Push until the whole card is clear, not just its center.
              const z = expand(r, b.w * 0.5, b.h * 0.5);
              if (!inside(b.x, b.y, z)) continue;
              // Spring out along the shallowest side, proportional to overlap. A
              // constant shove chatters against the walls when space is tight.
              const escapes = [
                { depth: b.x - z.left, dx: -1, dy: 0 },
                { depth: z.right - b.x, dx: 1, dy: 0 },
                { depth: b.y - z.top, dx: 0, dy: -1 },
                { depth: z.bottom - b.y, dx: 0, dy: 1 },
              ];
              const out = escapes.reduce((a, e) => (e.depth < a.depth ? e : a));
              b.vx += out.dx * out.depth * AVOID_SPRING * k;
              b.vy += out.dy * out.depth * AVOID_SPRING * k;
              b.vx *= CONTACT_DAMPING ** k;
              b.vy *= CONTACT_DAMPING ** k;
            }
          }
        }

        b.scale += ((b.drag ? 1.06 : 1) - b.scale) * Math.min(1, 0.25 * k);
        b.el.style.transform = `translate3d(${b.x - b.w / 2}px, ${b.y - b.h / 2}px, 0) rotate(${b.a}rad) scale(${b.scale})`;
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [getTable]);

  const register = useCallback(
    (clientId: string, el: HTMLElement) => {
      const table = getTable();
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      const spawn = spawns.get(clientId) ?? {
        kind: settled.current ? "drop" : "scatter",
      };
      const body: Body = {
        el,
        w,
        h,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        a: 0,
        va: 0,
        scale: 1,
        drag: null,
      };

      if (table) {
        const { bounds, avoid } = table;
        const rand = mulberry32(hash(clientId));
        const target = randomSpot(bounds, avoid, w, h, rand);
        const angle = (rand() - 0.5) * 0.5;
        if (spawn.kind === "scatter") {
          body.x = target.x;
          body.y = target.y;
          body.a = angle;
        } else {
          if (spawn.kind === "print") {
            body.x = spawn.x;
            body.y = spawn.y;
          } else {
            body.x = target.x + (rand() - 0.5) * 80;
            body.y = bounds.top - h;
          }
          // Throw it so friction brings it to rest on its spot: d = v / (1 - f).
          body.vx = (target.x - body.x) * (1 - FRICTION);
          body.vy = (target.y - body.y) * (1 - FRICTION);
          body.va = angle * (1 - SPIN_FRICTION);
        }
      }

      el.style.zIndex = String(zTop.current++);
      bodies.current.set(clientId, body);

      const onDown = (e: PointerEvent) => {
        if (e.button !== 0) return;
        e.preventDefault();
        el.setPointerCapture(e.pointerId);
        el.style.zIndex = String(zTop.current++);
        el.dataset.dragging = "";
        const p = toRoot(e);
        const dx = p.x - body.x;
        const dy = p.y - body.y;
        const cos = Math.cos(-body.a);
        const sin = Math.sin(-body.a);
        body.drag = {
          pointerId: e.pointerId,
          lx: dx * cos - dy * sin,
          ly: dx * sin + dy * cos,
          px: p.x,
          py: p.y,
          pvx: 0,
          pvy: 0,
          lastMove: e.timeStamp,
        };
      };

      const onMove = (e: PointerEvent) => {
        const d = body.drag;
        if (!d || e.pointerId !== d.pointerId) return;
        const p = toRoot(e);
        const frames = Math.max(e.timeStamp - d.lastMove, 1) / (1000 / 60);
        d.pvx = d.pvx * 0.5 + ((p.x - d.px) / frames) * 0.5;
        d.pvy = d.pvy * 0.5 + ((p.y - d.py) / frames) * 0.5;
        d.px = p.x;
        d.py = p.y;
        d.lastMove = e.timeStamp;
      };

      const onUp = (e: PointerEvent) => {
        const d = body.drag;
        if (!d || e.pointerId !== d.pointerId) return;
        const held = e.timeStamp - d.lastMove > 80;
        const speed = Math.hypot(d.pvx, d.pvy);
        const clamp = speed > MAX_THROW ? MAX_THROW / speed : 1;
        body.vx = held ? 0 : d.pvx * clamp;
        body.vy = held ? 0 : d.pvy * clamp;
        body.drag = null;
        delete el.dataset.dragging;
      };

      el.addEventListener("pointerdown", onDown);
      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerup", onUp);
      el.addEventListener("pointercancel", onUp);

      return () => {
        el.removeEventListener("pointerdown", onDown);
        el.removeEventListener("pointermove", onMove);
        el.removeEventListener("pointerup", onUp);
        el.removeEventListener("pointercancel", onUp);
        bodies.current.delete(clientId);
      };
    },
    [getTable, toRoot, spawns],
  );

  return (
    <div
      aria-label="Photo pile"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {photos.map((photo) => (
        <GalleryCard key={photo.clientId} photo={photo} register={register} />
      ))}
    </div>
  );
}

function GalleryCard({
  photo,
  register,
}: {
  photo: Photo;
  register: (clientId: string, el: HTMLElement) => () => void;
}) {
  const { clientId } = photo;
  const ref = useCallback(
    (el: HTMLElement) => register(clientId, el),
    [clientId, register],
  );
  return (
    <Polaroid
      photo={photo}
      ref={ref}
      className="pointer-events-auto absolute top-0 left-0 cursor-grab touch-none will-change-transform data-dragging:cursor-grabbing data-dragging:shadow-[0_2px_4px_rgb(0_0_0/0.1),0_24px_48px_-12px_rgb(0_0_0/0.4)]"
      style={{ transform: "translate3d(-9999px, 0, 0)" }}
    />
  );
}
