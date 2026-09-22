# brydon.io

A guestbook as a portfolio. Visitors take a photo with a CSS instant camera (or upload one),
sign it with their X handle, and it prints onto a shared table everyone can see in real time.
Prints can be picked up and thrown around. Only the newest fit on the table (10/20/30 by screen
size); everything else lives in the shoebox, a paginated archive in the corner.

- **Next.js + Tailwind + coss ui** for the page
- **Convex** for storage and live updates (`convex/`)
- **Vercel AI Gateway** moderates every photo before it goes on the table (`convex/moderation.ts`)

## Develop

```sh
npm install
npx convex dev   # local backend on :3210, writes .env.local
npm run dev      # http://localhost:3000
```

Without `NEXT_PUBLIC_CONVEX_URL` the app falls back to localStorage (no sharing).

## Rules

- One print per visitor: a newly approved print replaces that browser's previous one.
- Rate limits (`convex/photos.ts`): 3 quick shots then 1 per 10s per browser, 60/min globally,
  and 5 per day per IP in production.
- Photos stay hidden until moderation approves them. Without `AI_GATEWAY_API_KEY`
  everything is approved (local dev); if the gateway errors, the photo stays hidden.

## Environment

| Where | Variable | Purpose |
| --- | --- | --- |
Set these on Vercel. `scripts/vercel-build.mjs` copies the Convex ones into the production
Convex deployment on every production build.

| Variable | Read by | Purpose |
| --- | --- | --- |
| `CONVEX_DEPLOY_KEY` | build | Added by the Convex Marketplace integration |
| `AI_GATEWAY_API_KEY` | Convex | Moderation requests |
| `MODERATION_MODEL` | Convex | Optional, defaults to `google/gemini-2.5-flash-lite` |
| `UPLOAD_SECRET` | Convex + Next.js | Random value; turns on the per-IP limit |

## Admin

```sh
npx convex run photos:remove '{"clientId":"..."}'   # take one print down
npx convex run photos:clearAll                      # wipe the table
npx convex run seed:photos '{"count":80}'           # dev: placeholder prints from picsum.photos
npx convex run seed:clear                           # dev: remove them
```
