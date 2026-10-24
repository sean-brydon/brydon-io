import type { VercelConfig } from "@vercel/config/v1";

const revolutMe = "https://revolut.me/seanbrydon";

export const config: VercelConfig = {
  framework: "nextjs",
  // Syncs Convex secrets, pushes Convex functions (needs CONVEX_DEPLOY_KEY),
  // then builds Next.js with NEXT_PUBLIC_CONVEX_URL pointed at that deployment.
  buildCommand: "node scripts/vercel-build.mjs",
  // 307s stay temporary so the payment URL can change without browsers caching it.
  redirects: [
    { source: "/pay", destination: revolutMe, permanent: false },
    { source: "/pay/", destination: revolutMe, permanent: false },
    {
      source: "/(.*)",
      destination: revolutMe,
      permanent: false,
      // String host values are regexes, so match this host exactly.
      has: [{ type: "host", value: { eq: "pay.brydon.io" } }],
    },
  ],
};
