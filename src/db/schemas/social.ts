/**
 * Social tables — followers, reactions, comments, post views, notifications.
 */

import {
  pgTable,
  text,
  timestamp,
  boolean,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { users } from "./auth";
import { posts } from "./content";

// ─── Helper ──────────────────────────────────────────────────────────
const timestamps = {
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
};

// ─── Followers ───────────────────────────────────────────────────────
/**
 * Followers — many-to-many self-referencing relationship on users.
 * followerId follows followingId.
 */
export const followers = pgTable(
  "followers",
  {
    id: text("id").primaryKey(),
    followerId: text("follower_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    followingId: text("following_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("followers_unique_idx").on(
      table.followerId,
      table.followingId,
    ),
    index("followers_follower_id_idx").on(table.followerId),
    index("followers_following_id_idx").on(table.followingId),
  ],
);

// ─── Reactions ───────────────────────────────────────────────────────
/**
 * Reactions — emoji reactions on posts (like, love, fire, clap, insightful).
 * One reaction type per user per post.
 */
export const reactions = pgTable(
  "reactions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    postId: text("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    type: text("type").notNull(), // "like" | "love" | "fire" | "clap" | "insightful"
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("reactions_user_post_type_idx").on(
      table.userId,
      table.postId,
      table.type,
    ),
    index("reactions_post_id_idx").on(table.postId),
    index("reactions_user_id_idx").on(table.userId),
  ],
);

// ─── Comments ────────────────────────────────────────────────────────
/**
 * Comments — threaded comments on posts.
 * parentId enables nested replies.
 */
export const comments = pgTable(
  "comments",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    postId: text("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    parentId: text("parent_id"), // self-reference for threading
    content: text("content").notNull(),
    ...timestamps,
  },
  (table) => [
    index("comments_post_id_idx").on(table.postId),
    index("comments_user_id_idx").on(table.userId),
    index("comments_parent_id_idx").on(table.parentId),
  ],
);

// ─── Post Views ──────────────────────────────────────────────────────
/**
 * Post Views — tracks individual post views for analytics.
 * One view per user per post (upsert pattern for authenticated users).
 * Anonymous views have null userId.
 */
export const postViews = pgTable(
  "post_views",
  {
    id: text("id").primaryKey(),
    postId: text("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    viewedAt: timestamp("viewed_at").defaultNow().notNull(),
  },
  (table) => [
    index("post_views_post_id_idx").on(table.postId),
    index("post_views_user_id_idx").on(table.userId),
    uniqueIndex("post_views_user_post_idx").on(table.userId, table.postId),
  ],
);

// ─── Notifications ───────────────────────────────────────────────────
/**
 * Notifications — in-app notifications for social events.
 * type: "follow" | "reaction" | "comment" | "reply"
 * actorId is the user who triggered the notification.
 * resourceId points to the relevant post/comment.
 */
export const notifications = pgTable(
  "notifications",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    actorId: text("actor_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(), // "follow" | "reaction" | "comment" | "reply"
    resourceId: text("resource_id"), // post id or comment id
    read: boolean("read").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("notifications_user_id_idx").on(table.userId),
    index("notifications_user_read_idx").on(table.userId, table.read),
    index("notifications_actor_id_idx").on(table.actorId),
  ],
);
