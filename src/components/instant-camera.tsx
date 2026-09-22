"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Polaroid } from "@/components/polaroid";
import { cn } from "@/lib/utils";
import type { Photo } from "@/lib/photos";

export type CameraStatus = "idle" | "starting" | "live" | "error";

const SIZE = 720;
const STRIPES = ["#e5403a", "#f39a2b", "#f6cf3a", "#5cb85c", "#3a8fd9"];

/** Center-crop any image source to a square print-sized JPEG. */
export function squareJpeg(
  source: CanvasImageSource,
  width: number,
  height: number,
  mirror = false,
) {
  const side = Math.min(width, height);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = SIZE;
  const ctx = canvas.getContext("2d")!;
  if (mirror) {
    ctx.translate(SIZE, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(
    source,
    (width - side) / 2,
    (height - side) / 2,
    side,
    side,
    0,
    0,
    SIZE,
    SIZE,
  );
  return new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.85),
  );
}

/** A small WebP of a print for the table and shoebox (~15 KB instead of ~80 KB). */
export async function thumbnail(blob: Blob, size = 320) {
  const bitmap = await createImageBitmap(blob);
  try {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, size, size);
    return await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", 0.8),
    );
  } finally {
    bitmap.close();
  }
}

/** Load an uploaded image file (respecting EXIF rotation) and crop it square. */
export async function fileToSquareJpeg(file: File) {
  const bitmap = await createImageBitmap(file, {
    imageOrientation: "from-image",
  });
  try {
    return await squareJpeg(bitmap, bitmap.width, bitmap.height);
  } finally {
    bitmap.close();
  }
}

export function useWebcam() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraStatus>("idle");

  const start = useCallback(async () => {
    setStatus("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 1280 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setStatus("live");
    } catch {
      setStatus("error");
    }
  }, []);

  /** Grab a mirrored, center-cropped square frame from the webcam. */
  const capture = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return null;
    return squareJpeg(video, video.videoWidth, video.videoHeight, true);
  }, []);

  useEffect(
    () => () => streamRef.current?.getTracks().forEach((t) => t.stop()),
    [],
  );

  return { videoRef, status, start, capture };
}

export function InstantCamera({
  videoRef,
  status,
  printing,
  flashKey,
  onShutter,
  onPrinted,
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  status: CameraStatus;
  printing: Photo | null;
  flashKey: number;
  onShutter: () => void;
  onPrinted: (photo: Photo, rect: DOMRect) => void;
}) {
  const printRef = useRef<HTMLElement>(null);

  return (
    <div
      className={cn(
        "relative mx-auto w-[300px] sm:w-[340px]",
        printing && "animate-whirr",
      )}
    >
      {/* Top hump: flash + viewfinder */}
      <div className="relative mx-auto flex h-14 w-[78%] items-end justify-between rounded-t-[28px] bg-gradient-to-b from-neutral-800 to-neutral-900 px-5 pb-2 shadow-[inset_0_1px_0_rgb(255_255_255/0.15)]">
        <div
          key={flashKey}
          className={cn(
            "h-8 w-20 rounded-md border border-neutral-600 bg-[repeating-linear-gradient(90deg,#d4d4d4_0_2px,#f5f5f5_2px_5px)] shadow-[inset_0_2px_6px_rgb(0_0_0/0.35)]",
            flashKey > 0 && "animate-flash-bulb",
          )}
        />
        <div className="grid size-9 place-items-center rounded-lg bg-neutral-950 shadow-[inset_0_1px_3px_rgb(0_0_0/0.8),0_1px_0_rgb(255_255_255/0.08)]">
          <div className="size-5 rounded-sm bg-gradient-to-br from-sky-900/80 to-neutral-950" />
        </div>
      </div>

      {/* Body */}
      <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-b from-[#fbfaf7] to-[#e9e6df] shadow-[inset_0_2px_0_rgb(255_255_255),inset_0_-3px_0_rgb(0_0_0/0.08),0_30px_60px_-20px_rgb(0_0_0/0.35),0_8px_16px_-8px_rgb(0_0_0/0.2)]">
        {/* Rainbow stripe */}
        <div className="absolute inset-y-0 left-1/2 flex -translate-x-1/2">
          {STRIPES.map((c) => (
            <div key={c} className="w-2 sm:w-2.5" style={{ background: c }} />
          ))}
        </div>

        {/* Lower black front plate */}
        <div className="absolute inset-x-0 bottom-0 h-[46%] bg-gradient-to-b from-neutral-800 to-neutral-950 shadow-[inset_0_2px_0_rgb(255_255_255/0.08)]" />

        <div className="relative flex h-[220px] items-center justify-center sm:h-[244px]">
          {/* Lens */}
          <div className="relative grid size-[164px] place-items-center rounded-full bg-gradient-to-b from-neutral-700 to-neutral-950 shadow-[0_6px_16px_rgb(0_0_0/0.45),inset_0_1px_0_rgb(255_255_255/0.2)] sm:size-[180px]">
            <div className="grid size-[88%] place-items-center rounded-full bg-[repeating-radial-gradient(circle,#161616_0_2px,#222_2px_4px)] shadow-[inset_0_2px_6px_rgb(0_0_0/0.8)]">
              <div className="relative size-[80%] overflow-hidden rounded-full bg-[radial-gradient(circle_at_40%_35%,#1d3557,#070b14_70%)] shadow-[inset_0_0_0_3px_#0a0a0a,inset_0_0_18px_rgb(0_0_0/0.9)]">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={cn(
                    "absolute inset-0 size-full -scale-x-100 object-cover transition-opacity duration-700",
                    status === "live" ? "opacity-100" : "opacity-0",
                  )}
                />
                {/* Glass reflections */}
                <div className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_25%,rgb(255_255_255/0.35),transparent_22%),radial-gradient(circle_at_70%_75%,rgb(120_160_255/0.18),transparent_30%)]" />
                <div className="pointer-events-none absolute inset-0 rounded-full shadow-[inset_0_0_24px_rgb(0_0_0/0.7)]" />
              </div>
            </div>
          </div>

          {/* Shutter button */}
          <button
            type="button"
            onClick={onShutter}
            disabled={status === "starting" || !!printing}
            aria-label={status === "live" ? "Take photo" : "Turn on camera"}
            className="absolute top-6 left-6 size-11 cursor-pointer rounded-full bg-gradient-to-b from-red-500 to-red-700 shadow-[0_3px_0_#7f1d1d,0_5px_10px_rgb(0_0_0/0.3),inset_0_1px_0_rgb(255_255_255/0.35)] transition-[translate,box-shadow] outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:translate-y-[3px] active:shadow-[0_0_0_#7f1d1d,0_2px_4px_rgb(0_0_0/0.3)] disabled:cursor-not-allowed sm:size-12"
          />

          {/* Status light */}
          <div
            className={cn(
              "absolute top-8 right-7 size-2 rounded-full transition-colors",
              status === "live"
                ? "bg-emerald-400 shadow-[0_0_8px_#34d399]"
                : "bg-neutral-400",
            )}
          />

          <span className="absolute right-6 bottom-5 font-heading text-[11px] font-semibold tracking-[0.3em] text-neutral-400 uppercase">
            Instant
          </span>
        </div>

        {/* Print slot */}
        <div className="relative mx-auto mb-3 h-2 w-[62%] rounded-full bg-black shadow-[inset_0_2px_3px_rgb(0_0_0),0_1px_0_rgb(255_255_255/0.08)]" />
      </div>

      {/* Photos eject from the slot; clip everything above it */}
      <div className="absolute inset-x-0 top-[calc(100%-18px)] flex justify-center [clip-path:inset(0_-100vw_-100vh_-100vw)]">
        {printing && (
          <Polaroid
            key={printing.clientId}
            ref={printRef}
            photo={printing}
            className="animate-eject"
            onAnimationEnd={(e) => {
              if (e.target !== e.currentTarget) return;
              const el = printRef.current;
              setTimeout(
                () => el && onPrinted(printing, el.getBoundingClientRect()),
                400,
              );
            }}
          />
        )}
      </div>
    </div>
  );
}
