"use client";

import { ConfigurableParticles } from "@/components/configurable-particles";

// ─── Subtle background particles for the onboarding flow ────────────────────
// Low particle count + muted colors so they don't distract from form content.
// Non-interactive (clickToMorph disabled) — purely decorative.
export function OnboardingParticles() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
      <ConfigurableParticles
        shape1={{ type: "heart" }}
        shape2={{ type: "text", text: "✦" }}
        particleCount={400}
        height="100%"
        darkColor={[99, 102, 241]}
        lightColor={[79, 70, 229]}
        clickToMorph={false}
      />
    </div>
  );
}
