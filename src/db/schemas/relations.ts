/**
 * Drizzle relations — required for the relational query builder (db.query.*).
 */

import { relations } from "drizzle-orm";
import { users, sessions, accounts } from "./auth";
import { posts, projects, workExperiences, sections } from "./content";
import {
  followers,
  reactions,
  comments,
  postViews,
  notifications,
} from "./social";
import { companies, jobs, applications, savedJobs } from "./jobs";

// ─── Users ───────────────────────────────────────────────────────────
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
  posts: many(posts),
  projects: many(projects),
  workExperiences: many(workExperiences),
  sections: many(sections),
  // Social relations
  followers: many(followers, { relationName: "following" }), // people who follow this user
  following: many(followers, { relationName: "follower" }), // people this user follows
  reactions: many(reactions),
  comments: many(comments),
  postViews: many(postViews),
  notifications: many(notifications, { relationName: "notificationRecipient" }),
  actedNotifications: many(notifications, { relationName: "notificationActor" }),
  // Jobs relations
  companies: many(companies),
  jobs: many(jobs),
  applications: many(applications),
  savedJobs: many(savedJobs),
}));

// ─── Auth ────────────────────────────────────────────────────────────
export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

// ─── Content ─────────────────────────────────────────────────────────
export const postsRelations = relations(posts, ({ one, many }) => ({
  user: one(users, { fields: [posts.userId], references: [users.id] }),
  reactions: many(reactions),
  comments: many(comments),
  postViews: many(postViews),
}));

export const projectsRelations = relations(projects, ({ one }) => ({
  user: one(users, { fields: [projects.userId], references: [users.id] }),
}));

export const workExperiencesRelations = relations(workExperiences, ({ one }) => ({
  user: one(users, { fields: [workExperiences.userId], references: [users.id] }),
}));

export const sectionsRelations = relations(sections, ({ one }) => ({
  user: one(users, { fields: [sections.userId], references: [users.id] }),
}));

// ─── Social: Followers ──────────────────────────────────────────────
export const followersRelations = relations(followers, ({ one }) => ({
  follower: one(users, {
    fields: [followers.followerId],
    references: [users.id],
    relationName: "follower",
  }),
  following: one(users, {
    fields: [followers.followingId],
    references: [users.id],
    relationName: "following",
  }),
}));

// ─── Social: Reactions ──────────────────────────────────────────────
export const reactionsRelations = relations(reactions, ({ one }) => ({
  user: one(users, {
    fields: [reactions.userId],
    references: [users.id],
  }),
  post: one(posts, {
    fields: [reactions.postId],
    references: [posts.id],
  }),
}));

// ─── Social: Comments ───────────────────────────────────────────────
export const commentsRelations = relations(comments, ({ one, many }) => ({
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
  parent: one(comments, {
    fields: [comments.parentId],
    references: [comments.id],
    relationName: "commentReplies",
  }),
  replies: many(comments, { relationName: "commentReplies" }),
}));

// ─── Social: Post Views ─────────────────────────────────────────────
export const postViewsRelations = relations(postViews, ({ one }) => ({
  post: one(posts, {
    fields: [postViews.postId],
    references: [posts.id],
  }),
  viewer: one(users, {
    fields: [postViews.userId],
    references: [users.id],
  }),
}));

// ─── Social: Notifications ──────────────────────────────────────────
export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
    relationName: "notificationRecipient",
  }),
  actor: one(users, {
    fields: [notifications.actorId],
    references: [users.id],
    relationName: "notificationActor",
  }),
}));

// ─── Jobs: Companies ────────────────────────────────────────────────
export const companiesRelations = relations(companies, ({ one, many }) => ({
  user: one(users, { fields: [companies.userId], references: [users.id] }),
  jobs: many(jobs),
}));

// ─── Jobs: Jobs ─────────────────────────────────────────────────────
export const jobsRelations = relations(jobs, ({ one, many }) => ({
  user: one(users, { fields: [jobs.userId], references: [users.id] }),
  company: one(companies, { fields: [jobs.companyId], references: [companies.id] }),
  applications: many(applications),
  savedJobs: many(savedJobs),
}));

// ─── Jobs: Applications ─────────────────────────────────────────────
export const applicationsRelations = relations(applications, ({ one }) => ({
  user: one(users, { fields: [applications.userId], references: [users.id] }),
  job: one(jobs, { fields: [applications.jobId], references: [jobs.id] }),
}));

// ─── Jobs: Saved Jobs ───────────────────────────────────────────────
export const savedJobsRelations = relations(savedJobs, ({ one }) => ({
  user: one(users, { fields: [savedJobs.userId], references: [users.id] }),
  job: one(jobs, { fields: [savedJobs.jobId], references: [jobs.id] }),
}));
