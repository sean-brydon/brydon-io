-- Companies: add plan, industry, size, and Stripe billing columns
ALTER TABLE "companies" ADD COLUMN "plan" text DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "industry" text;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "size" text;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "stripe_customer_id" text;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "stripe_subscription_id" text;--> statement-breakpoint

-- Jobs: replace type → employment_type, salary → salary_min/salary_max/salary_currency, add remote_policy/experience_level/apply_url
ALTER TABLE "jobs" ADD COLUMN "employment_type" text DEFAULT 'full-time' NOT NULL;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "salary_min" text;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "salary_max" text;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "salary_currency" text DEFAULT 'USD' NOT NULL;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "remote_policy" text DEFAULT 'remote' NOT NULL;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "experience_level" text;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "apply_url" text;--> statement-breakpoint

-- Migrate existing data from old columns before dropping
UPDATE "jobs" SET "employment_type" = "type" WHERE "type" IS NOT NULL;--> statement-breakpoint

-- Drop old columns
ALTER TABLE "jobs" DROP COLUMN IF EXISTS "type";--> statement-breakpoint
ALTER TABLE "jobs" DROP COLUMN IF EXISTS "salary";--> statement-breakpoint

-- Replace unique index: (user_id, slug) → (company_id, slug) for URL routing
DROP INDEX IF EXISTS "jobs_user_slug_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "jobs_company_slug_idx" ON "jobs" USING btree ("company_id","slug");
