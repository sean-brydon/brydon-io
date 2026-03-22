import { ImageResponse } from "next/og";

export const alt = "sean brydon";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  // Generate heart particle positions
  const particles: { x: number; y: number; r: number; opacity: number }[] = [];
  for (let i = 0; i < 600; i++) {
    const t = (i / 600) * Math.PI * 2;
    const isOutline = i < 300;
    const scale = isOutline ? 1 : Math.sqrt(Math.random()) * 0.9;
    const px = 16 * Math.pow(Math.sin(t), 3) * scale;
    const py = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * scale;

    particles.push({
      x: 600 + px * 10 + (Math.random() - 0.5) * 4,
      y: 300 + py * 10 + (Math.random() - 0.5) * 4,
      r: 2 + Math.random() * 2,
      opacity: 0.3 + Math.random() * 0.5,
    });
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#050505",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "monospace",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Particles */}
        {particles.map((p, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: p.x - p.r,
              top: p.y - p.r,
              width: p.r * 2,
              height: p.r * 2,
              borderRadius: "50%",
              background: `rgba(99, 102, 241, ${p.opacity})`,
            }}
          />
        ))}

        {/* Text overlay */}
        <div
          style={{
            position: "absolute",
            bottom: 60,
            left: 60,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <span style={{ color: "#e0e0e0", fontSize: 40, fontWeight: 700, letterSpacing: -1 }}>
            sean brydon
          </span>
          <span style={{ color: "#6b7280", fontSize: 20 }}>
            developer · building cal.com
          </span>
        </div>

        {/* URL */}
        <span
          style={{
            position: "absolute",
            bottom: 60,
            right: 60,
            color: "#6366f1",
            fontSize: 18,
          }}
        >
          brydon.io
        </span>
      </div>
    ),
    { ...size }
  );
}
