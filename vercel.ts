import type { VercelConfig } from "@vercel/config/v1";

export const config: VercelConfig = {
  framework: "nextjs",
  // Syncs Convex secrets, pushes Convex functions (needs CONVEX_DEPLOY_KEY),
  // then builds Next.js with NEXT_PUBLIC_CONVEX_URL pointed at that deployment.
  buildCommand: "node scripts/vercel-build.mjs",
};
