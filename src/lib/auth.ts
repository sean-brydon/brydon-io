import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, username } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import * as schema from "@/db/schema";

export const auth = betterAuth({
  // ─── Database ────────────────────────────────────────────────────────
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
    usePlural: true, // our tables are "users", "sessions", "accounts", "verifications"
  }),

  // ─── Base URL ────────────────────────────────────────────────────────
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,

  // ─── Email & Password ───────────────────────────────────────────────
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    requireEmailVerification: false,
  },

  // ─── Social / OAuth Providers ────────────────────────────────────────
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },

  // ─── Session ─────────────────────────────────────────────────────────
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes — reduces DB lookups on hot paths
    },
  },

  // ─── Plugins ─────────────────────────────────────────────────────────
  plugins: [
    admin(),
    username({
      minUsernameLength: 3,
      maxUsernameLength: 30,
    }),
    nextCookies(), // SSR-friendly cookie handling for Next.js
  ],

  // ─── Additional user fields (SaaS profile extensions) ───────────────
  // Note: `username` is managed by the username plugin above (unique, sortable,
  // with normalization transforms). Do NOT redeclare it here.
  user: {
    additionalFields: {
      bio: {
        type: "string",
        required: false,
        input: true,
      },
      headline: {
        type: "string",
        required: false,
        input: true,
      },
      location: {
        type: "string",
        required: false,
        input: true,
      },
      githubUsername: {
        type: "string",
        required: false,
        input: true,
        fieldName: "github_username",
      },
      twitterUsername: {
        type: "string",
        required: false,
        input: true,
        fieldName: "twitter_username",
      },
      linkedinUrl: {
        type: "string",
        required: false,
        input: true,
        fieldName: "linkedin_url",
      },
      websiteUrl: {
        type: "string",
        required: false,
        input: true,
        fieldName: "website_url",
      },
    },
  },
});

// Export the type for use in route handlers and middleware
export type Auth = typeof auth;
