"use client";

import { useEffect, useRef } from "react";
import { Polaroid } from "@/components/polaroid";
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { useArchive } from "@/lib/photos";
import { cn } from "@/lib/utils";

const PAGE = 24;

/** A cardboard box of every print that no longer fits on the table. */
export function Shoebox({
  ref,
  gulps = 0,
}: {
  ref?: React.Ref<HTMLButtonElement>;
  /** Bump to play the "a print just went in" animation. */
  gulps?: number;
}) {
  return (
    <Dialog>
      <DialogTrigger
        ref={ref}
        aria-label="Open the shoebox of older prints"
        className="group relative block h-24 w-36 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-muted"
      >
        {/* A print dropping in, replayed on every gulp */}
        {gulps > 0 && (
          <span
            key={gulps}
            className="absolute bottom-10 left-1/2 h-16 w-14 -ml-7 animate-drop-in rounded-[2px] bg-[#fbfaf6] shadow-sm"
          />
        )}
        {/* Prints poking out of the box */}
        <span className="absolute bottom-10 left-5 h-16 w-14 -rotate-12 rounded-[2px] bg-[#fbfaf6] shadow-sm transition-transform duration-300 group-hover:-translate-y-3" />
        <span className="absolute bottom-10 left-14 h-16 w-14 rotate-6 rounded-[2px] bg-[#fbfaf6] shadow-sm transition-transform delay-75 duration-300 group-hover:-translate-y-4" />
        {/* Box */}
        <span
          key={`box-${gulps}`}
          className={cn(
            "absolute inset-x-0 bottom-0 h-16",
            gulps > 0 && "animate-gulp",
          )}
        >
          <span className="absolute inset-0 rounded-md bg-gradient-to-b from-[#c9a57b] to-[#b08a5f] shadow-[inset_0_-3px_0_rgb(0_0_0/0.12),0_10px_20px_-8px_rgb(0_0_0/0.35)]">
            <span className="absolute inset-x-0 top-0 h-3 rounded-t-md bg-[#d8b88f] shadow-[0_2px_0_rgb(0_0_0/0.08)]" />
            <span className="absolute inset-x-0 bottom-3 text-center font-hand text-[#5c4630] text-xl">
              the shoebox
            </span>
          </span>
        </span>
        {/* Lid leaning against the back */}
        <span className="absolute -right-3 bottom-12 h-4 w-32 origin-bottom-right rotate-[18deg] rounded-sm bg-gradient-to-b from-[#d8b88f] to-[#c49e72] shadow-sm transition-transform duration-300 group-hover:rotate-[26deg]" />
      </DialogTrigger>

      <DialogPopup className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="font-hand text-3xl">The shoebox</DialogTitle>
          <DialogDescription>
            Every print that’s been left on the table, newest first.
          </DialogDescription>
        </DialogHeader>
        <DialogPanel>
          <ShoeboxPrints />
        </DialogPanel>
      </DialogPopup>
    </Dialog>
  );
}

function ShoeboxPrints() {
  const { results, status, loadMore } = useArchive();
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Infinite scroll: fetch the next page when the bottom comes into view.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || status !== "CanLoadMore") return;
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && loadMore(PAGE),
      { rootMargin: "400px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [status, loadMore]);

  return (
    <>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-6 pb-2 sm:grid-cols-3 md:grid-cols-4">
        {results.map((photo, i) => (
          <li key={photo.clientId} className="flex justify-center">
            <Polaroid
              photo={photo}
              className="w-full sm:w-full"
              style={{ rotate: `${((i * 37) % 9) - 4}deg` }}
            />
          </li>
        ))}
      </ul>
      <div
        ref={sentinelRef}
        className="flex h-16 items-center justify-center text-muted-foreground text-sm"
      >
        {status === "LoadingFirstPage" || status === "LoadingMore" ? (
          <Spinner />
        ) : status === "Exhausted" ? (
          "That’s everyone. So far."
        ) : null}
      </div>
    </>
  );
}
