"use client";

import { useState } from "react";

const plans = [
  { id: "free", name: "free", price: "$0", features: ["developer profile", "blog", "social features", "apply to jobs"], jobs: "0 job posts" },
  { id: "starter", name: "starter", price: "$99/mo", features: ["everything in free", "3 active job posts", "company page", "basic applicant tracking"], jobs: "3 job posts" },
  { id: "business", name: "business", price: "$299/mo", features: ["everything in starter", "unlimited job posts", "developer search", "priority support"], jobs: "unlimited" },
  { id: "enterprise", name: "enterprise", price: "$999/mo", features: ["everything in business", "API access", "bulk posting", "dedicated support", "custom branding"], jobs: "unlimited + api" },
];

export function BillingPanel({ companyId, currentPlan, hasStripe }: { companyId: string; currentPlan: string; hasStripe: boolean }) {
  const [loading, setLoading] = useState<string | null>(null);

  async function upgrade(plan: string) {
    setLoading(plan);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ companyId, plan }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {} finally { setLoading(null); }
  }

  async function managePortal() {
    setLoading("portal");
    try {
      const res = await fetch("/api/billing/portal", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ companyId }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {} finally { setLoading(null); }
  }

  return (
    <div>
      {/* Current plan */}
      <div className="p-4 rounded-lg mb-8" style={{ background: "var(--card-bg)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>current plan</span>
            <h3 className="text-sm font-bold" style={{ color: "var(--text)" }}>{currentPlan}</h3>
          </div>
          {hasStripe && (
            <button onClick={managePortal} disabled={loading === "portal"} className="text-xs px-3 py-1.5 rounded-lg" style={{ color: "var(--accent)", background: "none", border: "1px solid var(--border)", cursor: "pointer" }}>
              {loading === "portal" ? "loading..." : "manage billing →"}
            </button>
          )}
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-2 gap-4">
        {plans.map((plan) => {
          const isCurrent = plan.id === currentPlan;
          return (
            <div key={plan.id} className="p-4 rounded-lg" style={{ background: "var(--card-bg)", border: `1px solid ${isCurrent ? "var(--accent)" : "var(--border)"}` }}>
              <div className="flex items-baseline justify-between mb-2">
                <h3 className="text-sm font-bold" style={{ color: "var(--text)" }}>{plan.name}</h3>
                <span className="text-xs font-semibold" style={{ color: "var(--accent)" }}>{plan.price}</span>
              </div>
              <p className="text-[10px] mb-3" style={{ color: "var(--text-muted)" }}>{plan.jobs}</p>
              <ul className="space-y-1 mb-4">
                {plan.features.map((f) => (
                  <li key={f} className="text-[10px]" style={{ color: "var(--text-muted)" }}>✓ {f}</li>
                ))}
              </ul>
              {isCurrent ? (
                <span className="text-[10px] px-3 py-1.5 rounded-lg inline-block" style={{ background: "color-mix(in srgb, var(--accent) 15%, transparent)", color: "var(--accent)" }}>current plan</span>
              ) : plan.id !== "free" ? (
                <button onClick={() => upgrade(plan.id)} disabled={!!loading} className="text-[10px] px-3 py-1.5 rounded-lg font-medium" style={{ background: "var(--accent)", color: "#fff", border: "none", cursor: "pointer" }}>
                  {loading === plan.id ? "loading..." : "upgrade"}
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
