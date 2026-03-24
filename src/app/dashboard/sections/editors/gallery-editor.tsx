"use client";

import type { SectionEditorProps } from "./types";
import { inputStyle } from "./types";

interface ImageEntry { url: string; caption: string }

export function GalleryEditor({ config, onChange }: SectionEditorProps) {
  const images: ImageEntry[] = (config.images as ImageEntry[]) ?? [];

  function update(imgs: ImageEntry[]) { onChange({ ...config, images: imgs }); }

  function updateImage(i: number, patch: Partial<ImageEntry>) {
    const next = [...images];
    next[i] = { ...next[i], ...patch };
    update(next);
  }

  function addImage() { update([...images, { url: "", caption: "" }]); }
  function removeImage(i: number) { update(images.filter((_, idx) => idx !== i)); }

  return (
    <div className="space-y-3">
      {images.map((img, i) => (
        <div key={i} className="flex gap-3 items-start">
          {/* Thumbnail */}
          <div
            className="w-12 h-12 rounded shrink-0 overflow-hidden flex items-center justify-center"
            style={{ background: "var(--card-bg)", border: "1px solid var(--border)" }}
          >
            {img.url ? (
              <img src={img.url} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            ) : (
              <span className="text-[10px]" style={{ color: "var(--text-muted)", opacity: 0.3 }}>img</span>
            )}
          </div>

          <div className="flex-1 space-y-1.5">
            <input
              value={img.url}
              onChange={(e) => updateImage(i, { url: e.target.value })}
              placeholder="image url"
              className="w-full text-xs px-2 py-1.5 rounded-lg outline-none"
              style={inputStyle}
            />
            <input
              value={img.caption}
              onChange={(e) => updateImage(i, { caption: e.target.value })}
              placeholder="caption"
              className="w-full text-xs px-2 py-1.5 rounded-lg outline-none"
              style={inputStyle}
            />
          </div>

          <button
            onClick={() => removeImage(i)}
            className="text-[10px] shrink-0 mt-1"
            style={{ color: "#ef4444", background: "none", border: "none", cursor: "pointer" }}
          >
            ×
          </button>
        </div>
      ))}

      <button
        onClick={addImage}
        className="text-[10px] px-3 py-1.5 rounded-lg"
        style={{ color: "var(--accent)", background: "none", border: "1px solid var(--border)", cursor: "pointer" }}
      >
        + add image
      </button>
    </div>
  );
}
