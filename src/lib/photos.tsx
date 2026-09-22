"use client";

import {
  ConvexProvider,
  ConvexReactClient,
  useMutation,
  usePaginatedQuery,
  useQuery,
} from "convex/react";
import { ConvexError } from "convex/values";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export type Photo = {
  clientId: string;
  /** X handle without the @, or "" for anonymous. */
  handle: string;
  takenAt: number;
  /** Small image for the table and shoebox. */
  src: string;
  /** Full-size print, when it differs from `src`. */
  fullSrc?: string;
};

export type NewPhoto = Omit<Photo, "src" | "fullSrc"> & {
  blob: Blob;
  thumb: Blob | null;
};

type PhotoStore = {
  photos: Photo[] | undefined;
  /** More prints exist than `photos` holds: they live in the shoebox. */
  hasMore: boolean;
  /** Whether the shoebox (paginated archive) is available: Convex mode only. */
  archive: boolean;
  add: (photo: NewPhoto) => Promise<void>;
};

const PhotoStoreContext = createContext<PhotoStore | null>(null);

export function usePhotoStore() {
  const store = useContext(PhotoStoreContext);
  if (!store)
    throw new Error("usePhotoStore must be used inside <PhotosProvider>");
  return store;
}

/** Anonymous per-browser id, used only as a rate-limit key. */
function sessionId() {
  try {
    let id = localStorage.getItem("camera-take:session");
    if (!id)
      localStorage.setItem("camera-take:session", (id = crypto.randomUUID()));
    return id;
  } catch {
    return "no-storage";
  }
}

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

export function PhotosProvider({ children }: { children: React.ReactNode }) {
  if (!convex) return <LocalPhotos>{children}</LocalPhotos>;
  return (
    <ConvexProvider client={convex}>
      <ConvexPhotos>{children}</ConvexPhotos>
    </ConvexProvider>
  );
}

function ConvexPhotos({ children }: { children: React.ReactNode }) {
  const result = useQuery(api.photos.list);
  const save = useMutation(api.photos.save);

  const add = useCallback(
    async ({ blob, thumb, clientId, handle }: NewPhoto) => {
      const session = sessionId();
      const grant = await fetch("/api/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session }),
      });
      const { urls, error } = await grant.json();
      if (!grant.ok) throw new ConvexError(error);

      const put = async (url: string, file: Blob) => {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        return (await res.json()).storageId as Id<"_storage">;
      };
      const [storageId, thumbId] = await Promise.all([
        put(urls.full, blob),
        thumb ? put(urls.thumb, thumb) : undefined,
      ]);
      const saved = await save({
        clientId,
        sessionId: session,
        handle,
        storageId,
        thumbId,
      });
      if (!saved) throw new Error("Photo rejected by upload checks");
    },
    [save],
  );

  const store = useMemo(
    () => ({
      photos: result?.photos,
      hasMore: result?.hasMore ?? false,
      archive: true,
      add,
    }),
    [result, add],
  );
  return <PhotoStoreContext value={store}>{children}</PhotoStoreContext>;
}

const STORAGE_KEY = "camera-take:photos";
const LOCAL_LIMIT = 24;

function readLocal(): Photo[] {
  try {
    const photos: Photo[] = JSON.parse(
      localStorage.getItem(STORAGE_KEY) ?? "[]",
    );
    // Prints saved before handles replaced names have no handle.
    return photos.map((p) => ({ ...p, handle: p.handle ?? "" }));
  } catch {
    return [];
  }
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function LocalPhotos({ children }: { children: React.ReactNode }) {
  const [photos, setPhotos] = useState<Photo[]>(readLocal);

  const add = useCallback(
    async ({ blob, clientId, handle, takenAt }: NewPhoto) => {
      const photo = {
        clientId,
        handle,
        takenAt,
        src: await blobToDataUrl(blob),
      };
      setPhotos((prev) => {
        const next = [photo, ...(prev ?? [])].slice(0, LOCAL_LIMIT);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          // Quota exceeded: keep it in memory for this session.
        }
        return next;
      });
    },
    [],
  );

  const store = useMemo(
    () => ({ photos, hasMore: false, archive: false, add }),
    [photos, add],
  );
  return <PhotoStoreContext value={store}>{children}</PhotoStoreContext>;
}

/** Every print ever approved, newest first. Only usable when `hasMore` is true (Convex mode). */
export function useArchive() {
  return usePaginatedQuery(api.photos.archive, {}, { initialNumItems: 24 });
}
