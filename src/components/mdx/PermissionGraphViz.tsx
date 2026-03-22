"use client";

import { useEffect, useRef, useState } from "react";

interface Node {
  id: string;
  x: number;
  y: number;
  label: string;
  active: boolean;
}

interface Edge {
  from: string;
  to: string;
}

export default function PermissionGraphViz() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const animProgress = useRef(0);
  const activatedNodes = useRef<Set<string>>(new Set());
  const activationOrder = useRef<{ id: string; delay: number }[]>([]);

  useEffect(() => {
    const cvs = ref.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d")!;
    const dpr = Math.min(window.devicePixelRatio, 2);
    let raf = 0;
    let dead = false;

    // Permission graph data
    const nodes: Node[] = [
      { id: "team.invite", x: 0.5, y: 0.12, label: "team.invite", active: false },
      { id: "team.remove", x: 0.82, y: 0.12, label: "team.remove", active: false },
      { id: "team.changeMemberRole", x: 0.18, y: 0.12, label: "team.changeRole", active: false },
      { id: "team.read", x: 0.28, y: 0.55, label: "team.read", active: false },
      { id: "team.listMembers", x: 0.62, y: 0.55, label: "team.listMembers", active: false },
      { id: "role.read", x: 0.5, y: 0.88, label: "role.read", active: false },
    ];

    const edges: Edge[] = [
      { from: "team.invite", to: "team.read" },
      { from: "team.invite", to: "team.listMembers" },
      { from: "team.invite", to: "role.read" },
      { from: "team.remove", to: "team.read" },
      { from: "team.remove", to: "team.listMembers" },
      { from: "team.changeMemberRole", to: "team.read" },
      { from: "team.changeMemberRole", to: "team.listMembers" },
      { from: "team.changeMemberRole", to: "role.read" },
    ];

    const resize = () => {
      const r = cvs.getBoundingClientRect();
      cvs.width = r.width * dpr;
      cvs.height = r.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const getNodePos = (node: Node, w: number, h: number) => {
      const pad = 60;
      return {
        x: pad + node.x * (w - pad * 2),
        y: pad + node.y * (h - pad * 2),
      };
    };

    // BFS activation
    const triggerBFS = (startId: string) => {
      activatedNodes.current = new Set([startId]);
      activationOrder.current = [{ id: startId, delay: 0 }];
      const queue = [{ id: startId, depth: 0 }];
      const visited = new Set([startId]);

      while (queue.length > 0) {
        const { id, depth } = queue.shift()!;
        const outEdges = edges.filter((e) => e.from === id);
        for (const edge of outEdges) {
          if (!visited.has(edge.to)) {
            visited.add(edge.to);
            activationOrder.current.push({ id: edge.to, delay: (depth + 1) * 0.3 });
            queue.push({ id: edge.to, depth: depth + 1 });
          }
        }
      }
      animProgress.current = 0;
    };

    // Auto-cycle through clickable nodes
    const clickableNodes = ["team.invite", "team.remove", "team.changeMemberRole"];
    let autoCycleIndex = 0;
    let lastAutoTrigger = 0;

    const draw = () => {
      if (dead) return;
      const r = cvs.getBoundingClientRect();
      const w = r.width, h = r.height;
      if (w === 0) { raf = requestAnimationFrame(draw); return; }

      const now = performance.now() / 1000;
      animProgress.current += 0.016;

      // Auto-cycle every 4 seconds if no manual interaction
      if (!activeNode && now - lastAutoTrigger > 4) {
        triggerBFS(clickableNodes[autoCycleIndex % clickableNodes.length]);
        autoCycleIndex++;
        lastAutoTrigger = now;
      }

      ctx.clearRect(0, 0, w, h);

      const isDark = document.documentElement.classList.contains("dark");
      const textCol = isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)";
      const dimCol = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
      const accentCol = isDark ? "#6366f1" : "#4f46e5";

      // Determine which nodes are active based on animation progress
      const currentlyActive = new Set<string>();
      for (const { id, delay } of activationOrder.current) {
        if (animProgress.current > delay) {
          currentlyActive.add(id);
        }
      }

      // Draw edges
      for (const edge of edges) {
        const fromNode = nodes.find((n) => n.id === edge.from)!;
        const toNode = nodes.find((n) => n.id === edge.to)!;
        const from = getNodePos(fromNode, w, h);
        const to = getNodePos(toNode, w, h);

        const isActive = currentlyActive.has(edge.from) && currentlyActive.has(edge.to);

        ctx.strokeStyle = isActive ? accentCol : dimCol;
        ctx.lineWidth = isActive ? 2 : 1;
        ctx.globalAlpha = isActive ? 0.6 : 0.3;
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();

        // Arrow head
        if (isActive) {
          const angle = Math.atan2(to.y - from.y, to.x - from.x);
          const arrowDist = 24;
          const ax = to.x - Math.cos(angle) * arrowDist;
          const ay = to.y - Math.sin(angle) * arrowDist;
          ctx.fillStyle = accentCol;
          ctx.beginPath();
          ctx.moveTo(ax + Math.cos(angle + 0.4) * 6, ay + Math.sin(angle + 0.4) * 6);
          ctx.lineTo(ax + Math.cos(angle) * 10, ay + Math.sin(angle) * 10);
          ctx.lineTo(ax + Math.cos(angle - 0.4) * 6, ay + Math.sin(angle - 0.4) * 6);
          ctx.fill();
        }

        ctx.globalAlpha = 1;
      }

      // Draw nodes
      for (const node of nodes) {
        const pos = getNodePos(node, w, h);
        const isActive = currentlyActive.has(node.id);
        const isRoot = activationOrder.current[0]?.id === node.id && isActive;

        const radius = isRoot ? 20 : 16;

        // Node circle
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = isActive ? accentCol : isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)";
        ctx.globalAlpha = isActive ? (isRoot ? 0.25 : 0.15) : 0.5;
        ctx.fill();
        ctx.strokeStyle = isActive ? accentCol : dimCol;
        ctx.lineWidth = isActive ? 2 : 1;
        ctx.globalAlpha = isActive ? 0.8 : 0.3;
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Label
        ctx.fillStyle = isActive ? accentCol : textCol;
        ctx.font = `${isActive ? "600" : "400"} 9px monospace`;
        ctx.textAlign = "center";
        ctx.fillText(node.label, pos.x, pos.y + radius + 14);
      }
    };

    // Click handler
    const handleClick = (e: MouseEvent) => {
      const rect = cvs.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      for (const node of nodes) {
        const pos = getNodePos(node, rect.width, rect.height);
        const dist = Math.sqrt((mx - pos.x) ** 2 + (my - pos.y) ** 2);
        if (dist < 24 && clickableNodes.includes(node.id)) {
          setActiveNode(node.id);
          triggerBFS(node.id);
          lastAutoTrigger = performance.now() / 1000;
          break;
        }
      }
    };

    cvs.addEventListener("click", handleClick);

    const loop = () => { draw(); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);

    // Initial trigger
    triggerBFS("team.invite");
    lastAutoTrigger = performance.now() / 1000;

    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      cvs.removeEventListener("click", handleClick);
    };
  }, []);

  return (
    <div className="my-8 rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)", background: "var(--code-bg)" }}>
      <canvas ref={ref} style={{ width: "100%", height: 260, display: "block", cursor: "pointer" }} />
      <div className="px-3 py-2 text-[10px]" style={{ borderTop: "1px solid var(--border)", color: "var(--text-muted)" }}>
        click a top node to see its dependencies light up via BFS traversal
      </div>
    </div>
  );
}
