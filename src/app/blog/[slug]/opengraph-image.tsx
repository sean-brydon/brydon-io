import { ImageResponse } from "next/og";

export const alt = "Blog post";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const title = slug.replace(/-/g, " ");

  // Deterministic dots from slug
  const dots: { x: number; y: number; opacity: number }[] = [];
  let seed = 0;
  for (const c of slug) seed = ((seed << 5) - seed + c.charCodeAt(0)) | 0;
  const rng = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  for (let i = 0; i < 80; i++) {
    dots.push({ x: rng() * 1200, y: rng() * 630, opacity: 0.05 + rng() * 0.12 });
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
          justifyContent: "space-between",
          fontFamily: "monospace",
          padding: 60,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {dots.map((d, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: d.x,
              top: d.y,
              width: 4,
              height: 4,
              borderRadius: "50%",
              background: `rgba(99, 102, 241, ${d.opacity})`,
            }}
          />
        ))}

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#6366f1" }} />
          <span style={{ color: "#6b7280", fontSize: 18 }}>brydon.io/blog</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 900 }}>
          <span style={{ color: "#e0e0e0", fontSize: 52, fontWeight: 700, letterSpacing: -1, lineHeight: 1.2 }}>
            {title}
          </span>
          <div style={{ width: 60, height: 3, background: "#6366f1", borderRadius: 2 }} />
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img
              src="https://avatars.githubusercontent.com/u/55134778?s=64"
              width={32}
              height={32}
              style={{ borderRadius: "50%" }}
            />
            <span style={{ color: "#6b7280", fontSize: 18 }}>sean brydon</span>
          </div>
          <span style={{ color: "#6366f1", fontSize: 16 }}>brydon.io</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
