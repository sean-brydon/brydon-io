import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction, internalMutation } from "./_generated/server";
import { deletePhoto } from "./photoFiles";

const PREFIX = "seed-";

/**
 * Dev only: fill the table with placeholder photos from picsum.photos.
 *   npx convex run seed:photos '{"count":80}'
 *   npx convex run seed:photos '{"count":14,"anonymous":true}'   (signed "a friend")
 *   npx convex run seed:clear
 */
export const photos = internalAction({
  args: { count: v.number(), anonymous: v.optional(v.boolean()) },
  handler: async (ctx, { count, anonymous }) => {
    for (let i = 0; i < count; i++) {
      const key = `${Date.now()}-${i}`;
      const [full, thumb] = await Promise.all([
        fetch(`https://picsum.photos/seed/${key}/720.jpg`).then((r) =>
          r.blob(),
        ),
        fetch(`https://picsum.photos/seed/${key}/320.webp`).then((r) =>
          r.blob(),
        ),
      ]);
      await ctx.runMutation(internal.seed.insert, {
        clientId: `${PREFIX}${key}`,
        handle: anonymous ? "" : `guest_${String(i + 1).padStart(3, "0")}`,
        storageId: await ctx.storage.store(full),
        thumbId: await ctx.storage.store(thumb),
      });
    }
    return count;
  },
});

export const insert = internalMutation({
  args: {
    clientId: v.string(),
    handle: v.string(),
    storageId: v.id("_storage"),
    thumbId: v.id("_storage"),
  },
  handler: (ctx, args) =>
    ctx.db.insert("photos", {
      clientId: args.clientId,
      name: args.handle,
      storageId: args.storageId,
      thumbId: args.thumbId,
      status: "approved",
    }),
});

export const clear = internalMutation({
  args: {},
  handler: async (ctx) => {
    const photos = await ctx.db.query("photos").collect();
    const seeded = photos.filter((p) => p.clientId.startsWith(PREFIX));
    for (const photo of seeded) await deletePhoto(ctx, photo);
    return seeded.length;
  },
});
