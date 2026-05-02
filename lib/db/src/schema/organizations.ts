import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ORG_ROLES = ["Admin", "Coordinator", "Viewer"] as const;
export type OrgRole = (typeof ORG_ROLES)[number];

export const organizationsTable = pgTable("organizations", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description"),
  inviteCode: text("invite_code").notNull().$defaultFn(() =>
    Math.random().toString(36).substring(2, 8).toUpperCase()
  ),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const orgMembersTable = pgTable("org_members", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  orgId: text("org_id").notNull().references(() => organizationsTable.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  email: text("email").notNull(),
  fullName: text("full_name"),
  role: text("role").notNull().default("Coordinator").$type<OrgRole>(),
  joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertOrgSchema = createInsertSchema(organizationsTable).omit({ id: true, inviteCode: true, createdAt: true });
export const insertOrgMemberSchema = createInsertSchema(orgMembersTable).omit({ id: true, joinedAt: true });
export type InsertOrg = z.infer<typeof insertOrgSchema>;
export type InsertOrgMember = z.infer<typeof insertOrgMemberSchema>;
export type Organization = typeof organizationsTable.$inferSelect;
export type OrgMember = typeof orgMembersTable.$inferSelect;
