import type { Doc } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

/** Delete a photo row and every file it owns. */
export async function deletePhoto(ctx: MutationCtx, photo: Doc<"photos">) {
  await ctx.storage.delete(photo.storageId);
  if (photo.thumbId) await ctx.storage.delete(photo.thumbId);
  await ctx.db.delete(photo._id);
}

/** What the client needs to draw a print. */
export async function toPrint(ctx: QueryCtx, photo: Doc<"photos">) {
  const full = (await ctx.storage.getUrl(photo.storageId)) ?? "";
  const thumb = photo.thumbId ? await ctx.storage.getUrl(photo.thumbId) : null;
  return {
    clientId: photo.clientId,
    handle: photo.name,
    takenAt: photo._creationTime,
    src: thumb ?? full,
    fullSrc: full,
  };
}
