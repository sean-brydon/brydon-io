/**
 * Drizzle relations — required for the relational query builder (db.query.*).
 */

import { relations } from "drizzle-orm";
import { users, sessions, accounts } from "./auth";
import { posts, projects, workExperiences, sections } from "./content";

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
  posts: many(posts),
  projects: many(projects),
  workExperiences: many(workExperiences),
  sections: many(sections),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const postsRelations = relations(posts, ({ one }) => ({
  user: one(users, { fields: [posts.userId], references: [users.id] }),
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
