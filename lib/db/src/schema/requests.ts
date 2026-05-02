import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { hubsTable } from "./hubs";
import { itemsTable } from "./items";

export const REQUEST_PRIORITIES = ["Low", "Medium", "Urgent", "Critical"] as const;
export const REQUEST_STATUSES = ["Draft", "Open", "Assigned", "Dispatched", "Delivered"] as const;
export type RequestPriority = (typeof REQUEST_PRIORITIES)[number];
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const requestsTable = pgTable("requests", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  orgId: text("org_id"),
  requestingHubId: text("requesting_hub_id").notNull().references(() => hubsTable.id),
  priority: text("priority").notNull().$type<RequestPriority>(),
  status: text("status").notNull().default("Draft").$type<RequestStatus>(),
  notes: text("notes"),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const requestItemsTable = pgTable("request_items", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  requestId: text("request_id").notNull().references(() => requestsTable.id, { onDelete: "cascade" }),
  itemId: text("item_id").notNull().references(() => itemsTable.id),
  quantityNeeded: integer("quantity_needed").notNull(),
});

export const insertRequestSchema = createInsertSchema(requestsTable).omit({ id: true, createdAt: true });
export const insertRequestItemSchema = createInsertSchema(requestItemsTable).omit({ id: true });
export type InsertRequest = z.infer<typeof insertRequestSchema>;
export type InsertRequestItem = z.infer<typeof insertRequestItemSchema>;
export type Request = typeof requestsTable.$inferSelect;
export type RequestItem = typeof requestItemsTable.$inferSelect;
