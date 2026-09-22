import { ipAddress } from "@vercel/functions";
import { ConvexHttpClient } from "convex/browser";
import { ConvexError } from "convex/values";
import { createHash } from "node:crypto";
import { api } from "../../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/** Hands out a Convex upload URL, rate limited by (hashed) visitor IP. */
export async function POST(request: Request) {
  const { sessionId } = await request.json().catch(() => ({}));
  if (typeof sessionId !== "string")
    return Response.json({ error: "Bad request" }, { status: 400 });

  const secret = process.env.UPLOAD_SECRET;
  const ip =
    ipAddress(request) ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  // Never store raw IPs; the hash is only a rate-limit key.
  const ipKey = createHash("sha256")
    .update(`${secret ?? ""}:${ip}`)
    .digest("hex")
    .slice(0, 32);

  try {
    const urls = await convex.mutation(api.photos.generateUploadUrl, {
      sessionId,
      ip: ipKey,
      secret,
    });
    return Response.json({ urls });
  } catch (err) {
    if (err instanceof ConvexError)
      return Response.json({ error: err.data }, { status: 429 });
    console.error(err);
    return Response.json({ error: "Upload unavailable" }, { status: 500 });
  }
}
