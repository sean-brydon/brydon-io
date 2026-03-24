/**
 * Jobs tables — companies, job listings, applications, and saved jobs.
 */

import {
  pgTable,
  text,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { users } from "./auth";

// ─── Helper ──────────────────────────────────────────────────────────
const timestamps = {
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
};

// ─── Companies ───────────────────────────────────────────────────────
/**
 * Companies — employer profiles created by users.
 * Each user can create multiple companies, but slug is unique per user.
 */
export const companies = pgTable(
  "companies",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    logo: text("logo"),
    website: text("website"),
    location: text("location"),
    plan: text("plan").notNull().default("free"), // "free" | "pro" | "enterprise"
    industry: text("industry"),
    size: text("size"), // "1-10" | "11-50" | "51-200" | "201-500" | "501+"
    stripeCustomerId: text("stripe_customer_id"),
    stripeSubscriptionId: text("stripe_subscription_id"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("companies_user_slug_idx").on(table.userId, table.slug),
    index("companies_user_id_idx").on(table.userId),
  ],
);

// ─── Jobs ────────────────────────────────────────────────────────────
/**
 * Jobs — job listings posted under a company.
 * userId is the poster; companyId links to the employer.
 */
export const jobs = pgTable(
  "jobs",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    companyId: text("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    location: text("location"),
    employmentType: text("employment_type").notNull().default("full-time"), // "full-time" | "part-time" | "contract" | "freelance" | "internship"
    salaryMin: text("salary_min"),
    salaryMax: text("salary_max"),
    salaryCurrency: text("salary_currency").notNull().default("USD"),
    remotePolicy: text("remote_policy").notNull().default("remote"), // "remote" | "hybrid" | "onsite"
    experienceLevel: text("experience_level"), // "entry" | "mid" | "senior" | "lead" | "executive"
    applyUrl: text("apply_url"),
    tags: jsonb("tags").$type<string[]>().default([]),
    status: text("status").notNull().default("draft"), // "draft" | "published" | "closed"
    publishedAt: timestamp("published_at"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("jobs_company_slug_idx").on(table.companyId, table.slug),
    index("jobs_user_id_idx").on(table.userId),
    index("jobs_company_id_idx").on(table.companyId),
    index("jobs_status_idx").on(table.userId, table.status),
  ],
);

// ─── Applications ────────────────────────────────────────────────────
/**
 * Applications — a user applies to a job.
 * One application per user per job.
 */
export const applications = pgTable(
  "applications",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    jobId: text("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    coverLetter: text("cover_letter"),
    resumeUrl: text("resume_url"),
    status: text("status").notNull().default("pending"), // "pending" | "reviewed" | "accepted" | "rejected"
    ...timestamps,
  },
  (table) => [
    uniqueIndex("applications_user_job_idx").on(table.userId, table.jobId),
    index("applications_user_id_idx").on(table.userId),
    index("applications_job_id_idx").on(table.jobId),
  ],
);

// ─── Saved Jobs ──────────────────────────────────────────────────────
/**
 * Saved Jobs — bookmarked jobs for a user.
 * One save per user per job (simple bookmark, createdAt only).
 */
export const savedJobs = pgTable(
  "saved_jobs",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    jobId: text("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("saved_jobs_user_job_idx").on(table.userId, table.jobId),
    index("saved_jobs_user_id_idx").on(table.userId),
    index("saved_jobs_job_id_idx").on(table.jobId),
  ],
);
