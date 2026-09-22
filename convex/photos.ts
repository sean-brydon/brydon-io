import { DAY, MINUTE, RateLimiter } from "@convex-dev/rate-limiter";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { components, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import {
  internalMutation,
  type MutationCtx,
  mutation,
  query,
} from "./_generated/server";
import { deletePhoto, toPrint } from "./photoFiles";

const MAX_BYTES = 1_500_000;
const MAX_THUMB_BYTES = 150_000;
const MAX_PHOTOS = 40;
const HANDLE = /^[A-Za-z0-9_]{1,15}$/;

const rateLimiter = new RateLimiter(components.rateLimiter, {
  // Per browser: a burst of 3, then one every 10s.
  photoPerSession: {
    kind: "token bucket",
    rate: 6,
    period: MINUTE,
    capacity: 3,
  },
  // Everyone together, so rotating session ids can't flood the pile.
  photoGlobal: { kind: "token bucket", rate: 60, period: MINUTE, capacity: 20 },
  // Per IP, checked only when requests come through the Next.js route (see UPLOAD_SECRET).
  photoPerIp: { kind: "token bucket", rate: 5, period: DAY, capacity: 5 },
});

/** The newest prints for the table, plus whether older ones exist for the shoebox. */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const photos = await ctx.db
      .query("photos")
      .withIndex("by_status", (q) => q.eq("status", "approved"))
      .order("desc")
      .take(MAX_PHOTOS + 1);
    return {
      photos: await Promise.all(
        photos.slice(0, MAX_PHOTOS).map((p) => toPrint(ctx, p)),
      ),
      hasMore: photos.length > MAX_PHOTOS,
    };
  },
});

/** Every approved print, newest first, a page at a time. */
export const archive = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, { paginationOpts }) => {
    const page = await ctx.db
      .query("photos")
      .withIndex("by_status", (q) => q.eq("status", "approved"))
      .order("desc")
      .paginate(paginationOpts);
    return {
      ...page,
      page: await Promise.all(page.page.map((p) => toPrint(ctx, p))),
    };
  },
});

/**
 * Called by the Next.js /api/upload-url route, which knows the visitor's IP.
 * When UPLOAD_SECRET is set (production), direct calls without it are refused,
 * so the per-IP limit can't be skipped. Locally it's unset and the IP limit is off.
 */
export const generateUploadUrl = mutation({
  args: {
    sessionId: v.string(),
    ip: v.optional(v.string()),
    secret: v.optional(v.string()),
  },
  handler: async (ctx, { sessionId, ip, secret }) => {
    const expected = process.env.UPLOAD_SECRET;
    if (expected) {
      if (secret !== expected || !ip) throw new Error("Unauthorized");
      await rateLimiter.limit(ctx, "photoPerIp", { key: ip, throws: true });
    }
    await rateLimiter.limit(ctx, "photoPerSession", {
      key: sessionId.slice(0, 64),
      throws: true,
    });
    await rateLimiter.limit(ctx, "photoGlobal", { throws: true });
    // One for the full print, one for its thumbnail.
    return {
      full: await ctx.storage.generateUploadUrl(),
      thumb: await ctx.storage.generateUploadUrl(),
    };
  },
});

async function isImage(
  ctx: MutationCtx,
  storageId: Id<"_storage">,
  maxBytes: number,
) {
  const file = await ctx.db.system.get(storageId);
  return (
    !!file && file.size <= maxBytes && !!file.contentType?.startsWith("image/")
  );
}

export const save = mutation({
  args: {
    clientId: v.string(),
    sessionId: v.string(),
    handle: v.string(),
    storageId: v.id("_storage"),
    thumbId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, { clientId, sessionId, handle, storageId, thumbId }) => {
    // Rejections return null instead of throwing: a thrown error rolls back
    // the mutation, which would undo these deletes and orphan the files.
    if (!(await isImage(ctx, storageId, MAX_BYTES))) {
      await ctx.storage.delete(storageId);
      if (thumbId) await ctx.storage.delete(thumbId);
      return null;
    }
    // A bad thumbnail isn't worth losing the photo over: fall back to the full print.
    let thumb = thumbId;
    if (thumbId && !(await isImage(ctx, thumbId, MAX_THUMB_BYTES))) {
      await ctx.storage.delete(thumbId);
      thumb = undefined;
    }

    const existing = await ctx.db
      .query("photos")
      .withIndex("by_clientId", (q) => q.eq("clientId", clientId))
      .unique();
    if (existing) return existing._id;

    const clean = handle.trim().replace(/^@/, "");
    const photoId = await ctx.db.insert("photos", {
      clientId: clientId.slice(0, 64),
      name: HANDLE.test(clean) ? clean : "",
      storageId,
      thumbId: thumb,
      status: "pending",
      sessionId: sessionId.slice(0, 64),
    });
    await ctx.scheduler.runAfter(0, internal.moderation.review, { photoId });
    return photoId;
  },
});

/** Wipe the table. Internal: run with `npx convex run photos:clearAll`. */
export const clearAll = internalMutation({
  args: {},
  handler: async (ctx) => {
    const photos = await ctx.db.query("photos").collect();
    for (const photo of photos) await deletePhoto(ctx, photo);
    return photos.length;
  },
});

/** Take one photo off the table. Internal: `npx convex run photos:remove '{"clientId":"..."}'`. */
export const remove = internalMutation({
  args: { clientId: v.string() },
  handler: async (ctx, { clientId }) => {
    const photo = await ctx.db
      .query("photos")
      .withIndex("by_clientId", (q) => q.eq("clientId", clientId))
      .unique();
    if (!photo) return false;
    await deletePhoto(ctx, photo);
    return true;
  },
});

/** One-off: rows from before moderation have no status. Run once per deployment. */
export const backfillStatus = internalMutation({
  args: {},
  handler: async (ctx) => {
    const photos = await ctx.db.query("photos").collect();
    let patched = 0;
    for (const photo of photos) {
      if (photo.status) continue;
      await ctx.db.patch(photo._id, { status: "approved" });
      patched++;
    }
    return patched;
  },
});

/** Uploaded files older than a day that no photo references (abandoned uploads). */
export const cleanupOrphans = internalMutation({
  args: {},
  handler: async (ctx) => {
    const referenced = new Set<string>();
    for (const photo of await ctx.db.query("photos").collect()) {
      referenced.add(photo.storageId);
      if (photo.thumbId) referenced.add(photo.thumbId);
    }
    const cutoff = Date.now() - DAY;
    let deleted = 0;
    for (const file of await ctx.db.system.query("_storage").collect()) {
      if (file._creationTime > cutoff || referenced.has(file._id)) continue;
      await ctx.storage.delete(file._id);
      deleted++;
    }
    return deleted;
  },
});
