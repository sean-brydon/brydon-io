import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Photo } from "@/lib/photos";

const DEVELOP_MS = 7000;

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "2-digit",
});

export function Polaroid({
  photo,
  className,
  ref,
  ...props
}: { photo: Photo } & React.ComponentProps<"figure">) {
  // Photos taken moments ago are still developing: offset the animation by
  // their age so a remount (e.g. print tray → gallery) doesn't restart it.
  const [age] = useState(() => Date.now() - photo.takenAt);
  const developing = age < DEVELOP_MS;

  return (
    <figure
      ref={ref}
      className={cn(
        "w-32 select-none rounded-[3px] bg-[#fbfaf6] p-2 pb-0 sm:p-2.5 sm:pb-0 shadow-[0_1px_2px_rgb(0_0_0/0.12),0_8px_24px_-8px_rgb(0_0_0/0.25)] sm:w-44",
        className,
      )}
      {...props}
    >
      <div className="relative aspect-square overflow-hidden bg-[#1d1b18]">
        {photo.src && (
          // eslint-disable-next-line @next/next/no-img-element -- blob/data/storage URLs
          <img
            src={photo.src}
            alt={photo.handle ? `Photo by @${photo.handle}` : "Guestbook photo"}
            draggable={false}
            loading="lazy"
            decoding="async"
            className={cn(
              "size-full object-cover [filter:contrast(1.08)_saturate(1.15)_sepia(0.12)]",
              developing && "animate-develop",
            )}
            style={developing ? { animationDelay: `-${age}ms` } : undefined}
          />
        )}
        <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_24px_rgb(0_0_0/0.25)]" />
      </div>
      <figcaption className="flex h-10 items-center justify-between gap-2 px-0.5 font-hand text-neutral-700 sm:h-14">
        <span
          className={cn(
            "truncate leading-none",
            photo.handle.length > 7
              ? "text-base sm:text-xl"
              : "text-lg sm:text-2xl",
          )}
        >
          {photo.handle ? `@${photo.handle}` : "a friend"}
        </span>
        <time
          dateTime={new Date(photo.takenAt).toISOString()}
          className="shrink-0 text-sm leading-none text-neutral-500 sm:text-base"
        >
          {dateFormat.format(photo.takenAt)}
        </time>
      </figcaption>
    </figure>
  );
}
