import { pgTable, text, integer, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { hubsTable } from "./hubs";
import { itemsTable } from "./items";

export const hubStockTable = pgTable("hub_stock", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  hubId: text("hub_id").notNull().references(() => hubsTable.id, { onDelete: "cascade" }),
  itemId: text("item_id").notNull().references(() => itemsTable.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull().default(0),
  expiryDate: date("expiry_date"),
  updatedBy: text("updated_by"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertHubStockSchema = createInsertSchema(hubStockTable).omit({ id: true, updatedAt: true });
export type InsertHubStock = z.infer<typeof insertHubStockSchema>;
export type HubStock = typeof hubStockTable.$inferSelect;
