import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  photos: defineTable({
    clientId: v.string(),
    /** X handle without the @, or "" for anonymous. */
    name: v.string(),
    storageId: v.id("_storage"),
    /** ~320px WebP drawn on the table and in the shoebox. Older rows don't have one. */
    thumbId: v.optional(v.id("_storage")),
    /** Hidden until moderation approves it. Older rows without a status count as approved. */
    status: v.optional(v.union(v.literal("pending"), v.literal("approved"))),
    /** The browser that took it. A newly approved print replaces that browser's older ones. */
    sessionId: v.optional(v.string()),
  })
    .index("by_clientId", ["clientId"])
    .index("by_status", ["status"])
    .index("by_sessionId", ["sessionId"]),
});
