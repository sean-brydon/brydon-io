import { v } from "convex/values";
import { internal } from "./_generated/api";
import { deletePhoto } from "./photoFiles";
import {
  internalAction,
  internalMutation,
  internalQuery,
} from "./_generated/server";

const GATEWAY_URL = "https://ai-gateway.vercel.sh/v1/chat/completions";
const DEFAULT_MODEL = "google/gemini-2.5-flash-lite";

const PROMPT = `You moderate a public photo guestbook on someone's personal website.
Visitors take a webcam photo and sign it with their X handle.

Reply with exactly one word: SAFE or UNSAFE.

UNSAFE if the photo or handle contains any of: nudity or sexual content, graphic violence or gore,
hate symbols, slurs, obscene gestures, drugs, self-harm, or readable personal documents.
Everything else is SAFE: selfies, silly faces, groups, pets, rooms, blank or blurry shots.`;

export const get = internalQuery({
  args: { photoId: v.id("photos") },
  handler: (ctx, { photoId }) => ctx.db.get(photoId),
});

export const decide = internalMutation({
  args: { photoId: v.id("photos"), approved: v.boolean() },
  handler: async (ctx, { photoId, approved }) => {
    const photo = await ctx.db.get(photoId);
    if (!photo) return;
    if (approved) {
      await ctx.db.patch(photoId, { status: "approved" });
      // One print per visitor: the new one replaces whatever they had on the table.
      if (photo.sessionId) {
        const older = await ctx.db
          .query("photos")
          .withIndex("by_sessionId", (q) => q.eq("sessionId", photo.sessionId))
          .collect();
        for (const old of older) {
          if (old._id !== photoId) await deletePhoto(ctx, old);
        }
      }
    } else {
      await deletePhoto(ctx, photo);
    }
  },
});

function toBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

/**
 * Ask a small vision model whether a photo can go on the wall.
 * Without AI_GATEWAY_API_KEY everything is approved (local dev). If the
 * gateway errors, the photo stays pending: failing closed on a public page.
 */
export const review = internalAction({
  args: { photoId: v.id("photos") },
  handler: async (ctx, { photoId }) => {
    const apiKey = process.env.AI_GATEWAY_API_KEY;
    if (!apiKey) {
      await ctx.runMutation(internal.moderation.decide, {
        photoId,
        approved: true,
      });
      return;
    }

    const photo = await ctx.runQuery(internal.moderation.get, { photoId });
    const image = photo && (await ctx.storage.get(photo.storageId));
    if (!photo || !image) return;

    const res = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.MODERATION_MODEL ?? DEFAULT_MODEL,
        temperature: 0,
        max_tokens: 5,
        messages: [
          { role: "system", content: PROMPT },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Handle: ${photo.name ? `@${photo.name}` : "(none)"}`,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${image.type};base64,${toBase64(await image.arrayBuffer())}`,
                },
              },
            ],
          },
        ],
      }),
    });
    if (!res.ok)
      throw new Error(
        `Moderation request failed: ${res.status} ${await res.text()}`,
      );

    const data = await res.json();
    const verdict = String(data.choices?.[0]?.message?.content ?? "")
      .trim()
      .toUpperCase();
    await ctx.runMutation(internal.moderation.decide, {
      photoId,
      approved: verdict.startsWith("SAFE"),
    });
  },
});
