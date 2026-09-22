"use client";

import { ConvexError } from "convex/values";
import { CameraIcon, ImageUpIcon } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  fileToSquareJpeg,
  InstantCamera,
  thumbnail,
  useWebcam,
} from "@/components/instant-camera";
import { Polaroid } from "@/components/polaroid";
import { PolaroidGallery, type Spawn } from "@/components/polaroid-gallery";
import { About, type PostLink } from "@/components/about";
import { type View, ViewToggle } from "@/components/view-toggle";
import { Shoebox } from "@/components/shoebox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { toastManager } from "@/components/ui/toast";
import { usePhotoStore, type Photo } from "@/lib/photos";
import { cn } from "@/lib/utils";

const HANDLE_KEY = "camera-take:handle";

const cleanHandle = (value: string) =>
  value
    .replace(/^@/, "")
    .replace(/[^A-Za-z0-9_]/g, "")
    .slice(0, 15);

export function PhotoBooth({ posts }: { posts: PostLink[] }) {
  const { photos: stored, hasMore, archive, add } = usePhotoStore();
  const tableLimit = useTableLimit();
  const { videoRef, status, start, capture } = useWebcam();

  const rootRef = useRef<HTMLElement>(null);
  const cameraRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const shoeboxRef = useRef<HTMLButtonElement>(null);
  const noteRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<View>("portfolio");

  const [handle, setHandle] = useState(() => {
    try {
      return localStorage.getItem(HANDLE_KEY) ?? "";
    } catch {
      return "";
    }
  });
  const [printing, setPrinting] = useState<Photo | null>(null);
  const [flashKey, setFlashKey] = useState(0);
  // Our own prints, shown instantly (from a local blob URL) while they upload.
  const [mine, setMine] = useState<Photo[]>([]);
  const [spawns] = useState(() => new Map<string, Spawn>());

  const photos = useMemo(() => {
    const byId = new Map<string, Photo>();
    // Oldest first, so the newest ends up on top of the pile.
    for (const p of [...(stored ?? [])].reverse()) byId.set(p.clientId, p);
    for (const p of mine) byId.set(p.clientId, p);
    if (printing) byId.delete(printing.clientId);
    // Only the newest prints fit on the table; the rest live in the shoebox.
    // (slice(-0) would return everything, hence the explicit empty table.)
    return tableLimit ? [...byId.values()].slice(-tableLimit) : [];
  }, [stored, mine, printing, tableLimit]);

  const noteHidden = mine.length > 0 || !!printing;
  // Phones have no pile: every print goes straight into the shoebox.
  const showShoebox =
    archive &&
    (tableLimit === 0 || hasMore || (stored?.length ?? 0) > tableLimit);

  // The shoebox gulps whenever a print lands in it.
  const [gulps, setGulps] = useState(0);
  const [tossing, setTossing] = useState<{
    photo: Photo;
    from: DOMRect;
  } | null>(null);

  // Someone else's print arriving live goes straight into the box on phones.
  const newestId = stored?.[0]?.clientId;
  const seenNewest = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!newestId) return;
    const first = seenNewest.current === undefined;
    seenNewest.current = newestId;
    if (
      !first &&
      tableLimit === 0 &&
      !mine.some((p) => p.clientId === newestId)
    ) {
      setGulps((g) => g + 1);
    }
  }, [newestId, tableLimit, mine]);

  const print = useCallback(
    (blob: Blob) => {
      const photo: Photo = {
        clientId: crypto.randomUUID(),
        handle,
        takenAt: Date.now(),
        src: URL.createObjectURL(blob),
      };
      setFlashKey((k) => k + 1);
      setPrinting(photo);

      // The thumbnail is a nice-to-have: never let a slow or stuck encode
      // hold up the upload itself.
      Promise.race([
        thumbnail(blob).catch(() => null),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
      ])
        .then((thumb) => add({ ...photo, blob, thumb }))
        .catch((err) => {
          const retryAfter =
            err instanceof ConvexError ? err.data?.retryAfter : undefined;
          toastManager.add({
            type: "error",
            title: retryAfter
              ? "Easy, trigger finger"
              : "Couldn't share that one",
            description: retryAfter
              ? `Only you can see that one. Try again in ${Math.ceil(retryAfter / 1000)}s.`
              : "It's only on your screen.",
          });
        });
    },
    [handle, add],
  );

  const shoot = useCallback(async () => {
    if (status !== "live") return start();
    if (printing) return;
    const blob = await capture();
    if (blob) print(blob);
  }, [status, start, printing, capture, print]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const upload = useCallback(
    async (file: File | undefined) => {
      if (!file || printing || !file.type.startsWith("image/")) return;
      try {
        const blob = await fileToSquareJpeg(file);
        if (blob) print(blob);
      } catch {
        toastManager.add({ type: "error", title: "Couldn't read that image" });
      }
    },
    [printing, print],
  );

  const onPrinted = useCallback(
    (photo: Photo, rect: DOMRect) => {
      if (tableLimit === 0) setTossing({ photo, from: rect });
      const root = rootRef.current!.getBoundingClientRect();
      spawns.set(photo.clientId, {
        kind: "print",
        x: rect.left + rect.width / 2 - root.left,
        y: rect.top + rect.height / 2 - root.top,
      });
      // One print per visitor: the new one replaces your last (the server
      // does the same for everyone else once it's approved).
      setMine([photo]);
      setPrinting(null);
    },
    [spawns, tableLimit],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space" || e.repeat) return;
      if (
        e.target instanceof HTMLElement &&
        e.target.closest("input, textarea, button")
      )
        return;
      e.preventDefault();
      shoot();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shoot]);

  return (
    <div
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes("Files")) e.preventDefault();
      }}
      onDrop={(e) => {
        e.preventDefault();
        upload(e.dataTransfer.files[0]);
      }}
      className="h-dvh overflow-hidden lg:grid lg:grid-cols-[minmax(340px,440px)_1fr]"
    >
      {/* On mobile the two columns become panels side by side, slid by the toggle. */}
      <div
        className={cn(
          "flex h-full w-[200%] transition-transform duration-500 ease-[cubic-bezier(0.7,0,0.3,1)] lg:contents",
          view === "guestbook" && "max-lg:-translate-x-1/2",
        )}
      >
        <About
          posts={posts}
          className="h-full w-1/2 shrink-0 overflow-y-auto px-6 pt-20 pb-8 sm:px-10 lg:w-auto lg:py-10"
        />

        <div className="h-full w-1/2 shrink-0 lg:w-auto lg:py-3 lg:pr-3">
          <section
            ref={rootRef}
            aria-label="Guestbook table"
            className="relative isolate h-full overflow-hidden bg-muted bg-[radial-gradient(--theme(--color-foreground/8%)_1px,transparent_1px)] bg-size-[18px_18px] lg:rounded-3xl lg:border"
          >
            <PolaroidGallery
              photos={photos}
              loaded={!!stored}
              spawns={spawns}
              rootRef={rootRef}
              avoidRefs={
                noteHidden
                  ? [cameraRef, controlsRef, shoeboxRef, toggleRef]
                  : [cameraRef, controlsRef, shoeboxRef, toggleRef, noteRef]
              }
            />

            <main className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-6 pb-24">
              <div ref={cameraRef} className="pointer-events-auto relative">
                <GuestbookNote ref={noteRef} hidden={noteHidden} />
                <InstantCamera
                  videoRef={videoRef}
                  status={status}
                  printing={printing}
                  flashKey={flashKey}
                  onShutter={shoot}
                  onPrinted={onPrinted}
                />
              </div>
            </main>

            {showShoebox && (
              <div className="absolute bottom-32 left-1/2 z-20 -translate-x-1/2 sm:bottom-6 sm:left-6 sm:translate-x-0">
                <Shoebox ref={shoeboxRef} gulps={gulps} />
              </div>
            )}

            <footer className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center p-4 sm:p-6">
              <div
                ref={controlsRef}
                className="pointer-events-auto flex w-full max-w-sm flex-col items-center gap-2"
              >
                <div className="flex w-full gap-2 rounded-xl border bg-background/80 p-1.5 shadow-lg/5 backdrop-blur">
                  <label className="flex min-w-0 flex-1 items-center rounded-lg border border-input bg-background ps-3 font-hand text-lg shadow-xs/5 has-focus-visible:border-ring has-focus-visible:ring-[3px] has-focus-visible:ring-ring/24">
                    <span className="text-muted-foreground">@</span>
                    <Input
                      unstyled
                      aria-label="Your X handle"
                      placeholder="your_handle"
                      autoComplete="off"
                      spellCheck={false}
                      value={handle}
                      onChange={(e) => {
                        const next = cleanHandle(e.target.value);
                        setHandle(next);
                        try {
                          localStorage.setItem(HANDLE_KEY, next);
                        } catch {}
                      }}
                      size="lg"
                      className="ps-0.5"
                    />
                  </label>
                  <Button
                    size="lg"
                    onClick={shoot}
                    loading={status === "starting"}
                    disabled={!!printing}
                  >
                    <CameraIcon />
                    {status === "live" ? "Snap" : "Take a photo"}
                  </Button>
                  <Button
                    size="icon-lg"
                    variant="outline"
                    aria-label="Upload a photo"
                    title="Upload a photo"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!!printing}
                  >
                    <ImageUpIcon />
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => {
                      upload(e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />
                </div>
                <p className="text-center text-muted-foreground text-xs">
                  {status === "error" ? (
                    <span className="text-destructive-foreground">
                      Camera blocked. Allow access in your browser and try
                      again.
                    </span>
                  ) : status === "live" ? (
                    <>
                      Press <Kbd>Space</Kbd> or the red button. Drag and throw
                      the prints.
                    </>
                  ) : (
                    "Sign with your X handle, then snap or upload. One print each, the newest wins."
                  )}
                </p>
              </div>
            </footer>
          </section>
        </div>
      </div>

      <ViewToggle
        ref={toggleRef}
        value={view}
        onChange={setView}
        className="fixed top-3 left-1/2 z-40 -translate-x-1/2 lg:hidden"
      />

      {tossing && (
        <TossIntoShoebox
          photo={tossing.photo}
          from={tossing.from}
          targetRef={shoeboxRef}
          onDone={() => {
            setTossing(null);
            setGulps((g) => g + 1);
          }}
        />
      )}

      <div
        key={flashKey}
        className={
          flashKey
            ? "pointer-events-none fixed inset-0 z-50 animate-flash bg-white"
            : "hidden"
        }
      />
    </div>
  );
}

function GuestbookNote({
  hidden,
  ref,
}: {
  hidden: boolean;
  ref: React.Ref<HTMLDivElement>;
}) {
  return (
    <div
      ref={ref}
      aria-hidden
      className={cn(
        "pointer-events-none absolute top-6 right-full mr-2 hidden -rotate-6 flex-col items-end font-hand text-2xl text-muted-foreground transition-opacity duration-500 md:flex",
        hidden && "opacity-0",
      )}
    >
      <span className="whitespace-nowrap">sign my guestbook</span>
      <svg
        viewBox="0 0 120 60"
        className="-mt-1 mr-[-52px] h-12 w-28"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <path d="M8 6 C 30 44, 70 54, 108 40" />
        <path d="M96 32 L 109 40 L 95 47" />
      </svg>
    </div>
  );
}

/** How many prints fit on the table: fewer on small screens. */
function useTableLimit() {
  return useSyncExternalStore(
    (onChange) => {
      window.addEventListener("resize", onChange);
      return () => window.removeEventListener("resize", onChange);
    },
    () => (window.innerWidth < 640 ? 0 : window.innerWidth < 1280 ? 20 : 26),
    () => 26,
  );
}

/** Phones: a finished print flies from the camera into the shoebox. */
function TossIntoShoebox({
  photo,
  from,
  targetRef,
  onDone,
}: {
  photo: Photo;
  from: DOMRect;
  targetRef: React.RefObject<HTMLElement | null>;
  onDone: () => void;
}) {
  const ref = useRef<HTMLElement>(null);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  });

  useEffect(() => {
    const el = ref.current;
    const to = targetRef.current?.getBoundingClientRect();
    if (!el || !to) return onDoneRef.current();
    const dx = to.left + to.width / 2 - (from.left + from.width / 2);
    const dy = to.top + to.height * 0.35 - (from.top + from.height / 2);
    const toss = el.animate(
      [
        { transform: "translate(0, 0) rotate(0deg) scale(1)" },
        {
          transform: `translate(${dx * 0.45}px, ${dy * 0.35 - 80}px) rotate(-14deg) scale(0.7)`,
          offset: 0.45,
        },
        {
          transform: `translate(${dx}px, ${dy}px) rotate(8deg) scale(0.25)`,
          opacity: 0.4,
        },
      ],
      {
        duration: 750,
        easing: "cubic-bezier(0.45, 0, 0.55, 1)",
        fill: "forwards",
      },
    );
    toss.onfinish = () => onDoneRef.current();
    return () => toss.cancel();
  }, [from, targetRef]);

  return (
    <Polaroid
      ref={ref}
      photo={photo}
      className="pointer-events-none fixed z-40"
      style={{ left: from.left, top: from.top, width: from.width }}
    />
  );
}
