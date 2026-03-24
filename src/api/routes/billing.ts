import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { companies } from "@/db/schema";
import { authMiddleware } from "@/api/middleware";
import { getStripe } from "@/lib/stripe";

// ─── Plan → Stripe Price ID mapping ─────────────────────────────────
const PLAN_PRICE_MAP: Record<string, string | undefined> = {
  starter: process.env.STRIPE_STARTER_PRICE_ID,
  business: process.env.STRIPE_BUSINESS_PRICE_ID,
  enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID,
};

const validPlans = Object.keys(PLAN_PRICE_MAP);

const app = new Hono()

  // ─── POST /checkout — Create a Stripe Checkout session ─────────────
  .post("/checkout", authMiddleware, async (c) => {
    const userId = c.get("userId" as never) as string;
    const body = await c.req.json();

    const { companyId, plan } = body as {
      companyId?: string;
      plan?: string;
    };

    // Validate inputs
    if (!companyId || !plan) {
      return c.json(
        { error: "companyId and plan are required" },
        400,
      );
    }

    if (!validPlans.includes(plan)) {
      return c.json(
        { error: `Invalid plan. Must be one of: ${validPlans.join(", ")}` },
        400,
      );
    }

    const stripe = getStripe();
    if (!stripe) {
      return c.json({ error: "Billing is not configured" }, 503);
    }

    const priceId = PLAN_PRICE_MAP[plan];
    if (!priceId) {
      return c.json(
        { error: `Price ID not configured for plan: ${plan}` },
        500,
      );
    }

    // Verify company ownership
    const company = await db.query.companies.findFirst({
      where: and(
        eq(companies.id, companyId),
        eq(companies.userId, userId),
      ),
    });

    if (!company) {
      return c.json({ error: "Company not found" }, 404);
    }

    // Re-use existing Stripe customer or create a new one
    let stripeCustomerId = company.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        metadata: {
          companyId: company.id,
          userId,
        },
      });

      stripeCustomerId = customer.id;

      // Persist the Stripe customer ID on the company
      await db
        .update(companies)
        .set({ stripeCustomerId })
        .where(eq(companies.id, company.id));
    }

    // Build success/cancel URLs
    const origin =
      c.req.header("origin") ??
      c.req.header("referer")?.replace(/\/+$/, "") ??
      process.env.NEXT_PUBLIC_APP_URL ??
      "http://localhost:3000";

    const successUrl = `${origin}/dashboard/companies/${company.id}/billing?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/dashboard/companies/${company.id}/billing`;

    // Create Checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        companyId: company.id,
        plan,
      },
    });

    return c.json({ url: session.url });
  })

  // ─── POST /portal — Create a Stripe Billing Portal session ────────
  .post("/portal", authMiddleware, async (c) => {
    const userId = c.get("userId" as never) as string;
    const body = await c.req.json();

    const { companyId } = body as { companyId?: string };

    if (!companyId) {
      return c.json({ error: "companyId is required" }, 400);
    }

    const stripe = getStripe();
    if (!stripe) {
      return c.json({ error: "Billing is not configured" }, 503);
    }

    // Verify company ownership
    const company = await db.query.companies.findFirst({
      where: and(
        eq(companies.id, companyId),
        eq(companies.userId, userId),
      ),
    });

    if (!company) {
      return c.json({ error: "Company not found" }, 404);
    }

    const stripeCustomerId = company.stripeCustomerId;

    if (!stripeCustomerId) {
      return c.json(
        { error: "No billing account found. Please subscribe to a plan first." },
        400,
      );
    }

    const returnUrl =
      c.req.header("origin") ??
      c.req.header("referer")?.replace(/\/+$/, "") ??
      process.env.NEXT_PUBLIC_APP_URL ??
      "http://localhost:3000";

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${returnUrl}/dashboard/companies/${company.id}/billing`,
    });

    return c.json({ url: portalSession.url });
  });

export default app;
