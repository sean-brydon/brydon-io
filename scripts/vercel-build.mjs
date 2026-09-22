// Vercel build: copy the secrets Convex functions read from Vercel's env into
// the Convex deployment, then push Convex functions and build Next.js against it.
// Vercel is the single source of truth; nothing is printed.
import { execFileSync } from "node:child_process";

const SYNCED = ["AI_GATEWAY_API_KEY", "UPLOAD_SECRET", "MODERATION_MODEL"];
const run = (args) => execFileSync("npx", ["convex", ...args], { stdio: ["ignore", "ignore", "inherit"] });

// Preview deployments are fresh Convex previews; only production keeps state.
if (process.env.VERCEL_ENV === "production") {
  for (const name of SYNCED) {
    if (process.env[name]) run(["env", "set", name, process.env[name]]);
  }
}

execFileSync("npx", ["convex", "deploy", "--cmd", "npm run build"], { stdio: "inherit" });
