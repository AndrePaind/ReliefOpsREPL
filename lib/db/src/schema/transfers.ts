import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { hubsTable } from "./hubs";
import { requestsTable } from "./requests";
import { itemsTable } from "./items";

export const TRANSFER_STATUSES = ["Planned", "Dispatched", "Delivered"] as const;
export type TransferStatus = (typeof TRANSFER_STATUSES)[number];

export const transfersTable = pgTable("transfers", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  requestId: text("request_id").notNull().references(() => requestsTable.id, { onDelete: "cascade" }),
  fromHubId: text("from_hub_id").notNull().references(() => hubsTable.id),
  toHubId: text("to_hub_id").notNull().references(() => hubsTable.id),
  status: text("status").notNull().default("Planned").$type<TransferStatus>(),
  etaMinutes: integer("eta_minutes"),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const transferItemsTable = pgTable("transfer_items", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  transferId: text("transfer_id").notNull().references(() => transfersTable.id, { onDelete: "cascade" }),
  itemId: text("item_id").notNull().references(() => itemsTable.id),
  quantity: integer("quantity").notNull(),
});

export const insertTransferSchema = createInsertSchema(transfersTable).omit({ id: true, createdAt: true });
export const insertTransferItemSchema = createInsertSchema(transferItemsTable).omit({ id: true });
export type InsertTransfer = z.infer<typeof insertTransferSchema>;
export type InsertTransferItem = z.infer<typeof insertTransferItemSchema>;
export type Transfer = typeof transfersTable.$inferSelect;
export type TransferItem = typeof transferItemsTable.$inferSelect;
