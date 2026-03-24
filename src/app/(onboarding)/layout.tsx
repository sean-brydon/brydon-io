import type { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { OnboardingParticles } from "./onboarding-particles";

// ─── Onboarding Layout (Server Component) ──────────────────────────────────
// Simple centered layout with no nav/sidebar for the onboarding flow.
// Requires authentication — unauthenticated users are redirected to sign-in.
export default async function OnboardingLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in?callbackUrl=/onboarding");
  }

  return (
    <div
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ background: "var(--bg)" }}
    >
      {/* Subtle background particles */}
      <OnboardingParticles />

      {/* Main content — above the particle canvas */}
      <main className="relative z-10 w-full max-w-2xl mx-auto px-6 py-12">
        {children}
      </main>
    </div>
  );
}
