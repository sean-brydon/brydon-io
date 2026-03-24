import { createAuthClient } from "better-auth/react";
import { usernameClient, adminClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  plugins: [usernameClient(), adminClient()],
});

// Convenience exports — prefer destructured usage in components:
//   import { authClient } from "@/lib/auth-client";
//   const { data: session } = authClient.useSession();
export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
} = authClient;
