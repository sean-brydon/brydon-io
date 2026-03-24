import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { db } from "@/db";
import { companies } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Stripe Webhook Handler
 *
 * This is a standalone Next.js route handler (NOT Hono) because
 * Hono's `handle()` parses the request body, which breaks Stripe's
 * signature verification that requires the raw body string.
 *
 * Handled events:
 * - checkout.session.completed — activate plan after successful checkout
 * - customer.subscription.updated — sync plan changes (upgrades/downgrades)
 * - customer.subscription.deleted — reset company to free plan
 */

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 },
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`⚠️  Stripe webhook signature verification failed: ${message}`);
    return NextResponse.json(
      { error: `Webhook signature verification failed` },
      { status: 400 },
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        await handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session,
        );
        break;
      }

      case "customer.subscription.updated": {
        await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription,
        );
        break;
      }

      case "customer.subscription.deleted": {
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription,
        );
        break;
      }

      default:
        // Unhandled event type — acknowledge receipt without processing
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }
  } catch (err) {
    console.error(`Error processing Stripe event ${event.type}:`, err);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}

// ─── Event Handlers ──────────────────────────────────────────────────

/**
 * checkout.session.completed
 *
 * Fired when a customer completes a Checkout Session. The session's
 * metadata must include `companyId` and `plan` (set when creating the
 * checkout session in the billing API route).
 */
async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
) {
  const companyId = session.metadata?.companyId;
  const plan = session.metadata?.plan;

  if (!companyId || !plan) {
    console.error(
      "checkout.session.completed missing metadata — companyId:",
      companyId,
      "plan:",
      plan,
    );
    return;
  }

  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id;

  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id;

  await db
    .update(companies)
    .set({
      plan,
      stripeCustomerId: customerId ?? null,
      stripeSubscriptionId: subscriptionId ?? null,
    })
    .where(eq(companies.id, companyId));

  console.log(
    `✅ Company ${companyId} upgraded to "${plan}" plan (customer: ${customerId})`,
  );
}

/**
 * customer.subscription.updated
 *
 * Fired when a subscription changes (upgrade, downgrade, or renewal).
 * We look up the company by stripeCustomerId and sync the plan from
 * the subscription's price metadata.
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id;

  if (!customerId) {
    console.error("subscription.updated missing customer ID");
    return;
  }

  // Extract plan from subscription metadata or the first price's metadata
  const plan =
    subscription.metadata?.plan ??
    subscription.items.data[0]?.price?.metadata?.plan;

  if (!plan) {
    console.error(
      `subscription.updated for customer ${customerId} has no plan in metadata — skipping`,
    );
    return;
  }

  await db
    .update(companies)
    .set({
      plan,
      stripeSubscriptionId: subscription.id,
    })
    .where(eq(companies.stripeCustomerId, customerId));

  console.log(
    `✅ Updated plan to "${plan}" for Stripe customer ${customerId}`,
  );
}

/**
 * customer.subscription.deleted
 *
 * Fired when a subscription is cancelled (immediately or at period end).
 * Reset the company back to the free plan and clear subscription ID.
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id;

  if (!customerId) {
    console.error("subscription.deleted missing customer ID");
    return;
  }

  await db
    .update(companies)
    .set({
      plan: "free",
      stripeSubscriptionId: null,
    })
    .where(eq(companies.stripeCustomerId, customerId));

  console.log(
    `✅ Reset company to free plan for Stripe customer ${customerId}`,
  );
}
