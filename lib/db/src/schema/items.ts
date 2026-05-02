import { pgTable, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ITEM_CATEGORIES = ["Medicine", "Food", "Hygiene", "First Aid"] as const;
export type ItemCategory = (typeof ITEM_CATEGORIES)[number];

export const itemsTable = pgTable("items", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  category: text("category").notNull().$type<ItemCategory>(),
  barcode: text("barcode"),
  unit: text("unit").notNull().default("units"),
  imageUrl: text("image_url"),
  tracksExpiry: boolean("tracks_expiry").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertItemSchema = createInsertSchema(itemsTable).omit({ id: true, createdAt: true });
export type InsertItem = z.infer<typeof insertItemSchema>;
export type Item = typeof itemsTable.$inferSelect;
