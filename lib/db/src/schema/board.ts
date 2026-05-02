import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { organizationsTable } from "./organizations";

export const BOARD_POST_TYPES = ["Availability", "Need", "Announcement"] as const;
export const BOARD_POST_STATUSES = ["Active", "Fulfilled", "Closed"] as const;
export type BoardPostType = (typeof BOARD_POST_TYPES)[number];
export type BoardPostStatus = (typeof BOARD_POST_STATUSES)[number];

export const boardPostsTable = pgTable("board_posts", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  orgId: text("org_id").notNull().references(() => organizationsTable.id, { onDelete: "cascade" }),
  orgName: text("org_name").notNull(),
  type: text("type").notNull().$type<BoardPostType>(),
  title: text("title").notNull(),
  content: text("content"),
  itemName: text("item_name"),
  quantity: integer("quantity"),
  location: text("location"),
  status: text("status").notNull().default("Active").$type<BoardPostStatus>(),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertBoardPostSchema = createInsertSchema(boardPostsTable).omit({ id: true, createdAt: true });
export type InsertBoardPost = z.infer<typeof insertBoardPostSchema>;
export type BoardPost = typeof boardPostsTable.$inferSelect;
