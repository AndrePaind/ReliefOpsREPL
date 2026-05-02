import { pgTable, text, boolean, doublePrecision, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { transfersTable } from "./transfers";

export const AVAILABILITY_STATUSES = ["Available", "Busy", "Offline"] as const;
export const TASK_TYPES = ["Pickup", "Delivery/Transfer", "Stock Count"] as const;
export const TASK_STATUSES = ["Open", "Assigned", "In Progress", "Done"] as const;
export type AvailabilityStatus = (typeof AVAILABILITY_STATUSES)[number];
export type TaskType = (typeof TASK_TYPES)[number];
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const volunteersTable = pgTable("volunteers", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  orgId: text("org_id"),
  fullName: text("full_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  hasVehicle: boolean("has_vehicle").notNull().default(false),
  availabilityStatus: text("availability_status").notNull().default("Available").$type<AvailabilityStatus>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const tasksTable = pgTable("tasks", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  orgId: text("org_id"),
  transferId: text("transfer_id").references(() => transfersTable.id, { onDelete: "cascade" }),
  volunteerId: text("volunteer_id").references(() => volunteersTable.id, { onDelete: "set null" }),
  type: text("type").notNull().$type<TaskType>(),
  status: text("status").notNull().default("Open").$type<TaskStatus>(),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertVolunteerSchema = createInsertSchema(volunteersTable).omit({ id: true, createdAt: true });
export const insertTaskSchema = createInsertSchema(tasksTable).omit({ id: true, createdAt: true });
export type InsertVolunteer = z.infer<typeof insertVolunteerSchema>;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Volunteer = typeof volunteersTable.$inferSelect;
export type Task = typeof tasksTable.$inferSelect;
