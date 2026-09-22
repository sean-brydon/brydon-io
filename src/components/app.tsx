"use client";

import dynamic from "next/dynamic";
import type { PostLink } from "@/components/about";

// Webcam + localStorage + physics: nothing worth server-rendering.
export const App = dynamic<{ posts: PostLink[] }>(
  async () => {
    const [{ PhotosProvider }, { PhotoBooth }] = await Promise.all([
      import("@/lib/photos"),
      import("@/components/photo-booth"),
    ]);
    return function App({ posts }: { posts: PostLink[] }) {
      return (
        <PhotosProvider>
          <PhotoBooth posts={posts} />
        </PhotosProvider>
      );
    };
  },
  { ssr: false },
);
