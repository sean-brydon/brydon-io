/**
 * Content tables — user-owned, multi-tenant by userId.
 */

import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
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

/**
 * Posts — blog posts stored as MDX/markdown.
 */
export const posts = pgTable(
  "posts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    content: text("content").notNull(),
    status: text("status").notNull().default("draft"),
    coverImage: text("cover_image"),
    tags: jsonb("tags").$type<string[]>().default([]),
    publishedAt: timestamp("published_at"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("posts_user_slug_idx").on(table.userId, table.slug),
    index("posts_user_id_idx").on(table.userId),
    index("posts_status_idx").on(table.userId, table.status),
  ],
);

/**
 * Projects — side-projects / portfolio entries.
 */
export const projects = pgTable(
  "projects",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    url: text("url"),
    repoUrl: text("repo_url"),
    coverImage: text("cover_image"),
    tags: jsonb("tags").$type<string[]>().default([]),
    featured: boolean("featured").notNull().default(false),
    status: text("status").notNull().default("active"),
    ...timestamps,
  },
  (table) => [index("projects_user_id_idx").on(table.userId)],
);

/**
 * Work experiences — timeline entries.
 */
export const workExperiences = pgTable(
  "work_experiences",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    company: text("company").notNull(),
    role: text("role").notNull(),
    description: text("description"),
    startDate: timestamp("start_date").notNull(),
    endDate: timestamp("end_date"),
    companyUrl: text("company_url"),
    companyLogo: text("company_logo"),
    location: text("location"),
    type: text("type").notNull().default("full-time"),
    ...timestamps,
  },
  (table) => [
    index("work_experiences_user_id_idx").on(table.userId),
    index("work_experiences_start_date_idx").on(table.userId, table.startDate),
  ],
);

/**
 * Sections — flexible, ordered content sections on profiles.
 */
export const sections = pgTable(
  "sections",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    title: text("title").notNull(),
    content: text("content"),
    order: integer("order").notNull().default(0),
    visible: boolean("visible").notNull().default(true),
    config: jsonb("config")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    ...timestamps,
  },
  (table) => [
    index("sections_user_id_idx").on(table.userId),
    index("sections_order_idx").on(table.userId, table.order),
  ],
);
