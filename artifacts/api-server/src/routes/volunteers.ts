import { Router } from "express";
import { db, volunteersTable, tasksTable } from "@workspace/db";
import { eq, and, inArray, sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { requireOrg } from "../lib/requireOrg";

const router = Router();

// GET /api/volunteers
router.get("/", requireAuth, requireOrg, async (req, res) => {
  const orgId = (req as any).orgId as string;
  const { availability, hasVehicle } = req.query as { availability?: string; hasVehicle?: string };
  const volunteers = await db.select().from(volunteersTable)
    .where(eq(volunteersTable.orgId, orgId))
    .orderBy(volunteersTable.fullName);

  const activeCounts = await db
    .select({ volunteerId: tasksTable.volunteerId, count: sql<number>`count(*)`.mapWith(Number) })
    .from(tasksTable)
    .where(and(eq(tasksTable.orgId, orgId), inArray(tasksTable.status, ["Open", "Assigned", "In Progress"])))
    .groupBy(tasksTable.volunteerId);

  const countMap: Record<string, number> = {};
  for (const row of activeCounts) if (row.volunteerId) countMap[row.volunteerId] = row.count;

  let result = volunteers.map((v) => ({ ...v, activeTasks: countMap[v.id] ?? 0 }));
  if (availability) result = result.filter((v) => v.availabilityStatus === availability);
  if (hasVehicle !== undefined) result = result.filter((v) => v.hasVehicle === (hasVehicle === "true"));
  res.json(result);
});

// POST /api/volunteers
router.post("/", requireAuth, requireOrg, async (req, res) => {
  const orgId = (req as any).orgId as string;
  const { fullName, email, phone, lat, lng, hasVehicle, availabilityStatus } = req.body;
  if (!fullName) { res.status(400).json({ error: "fullName is required" }); return; }
  const [volunteer] = await db.insert(volunteersTable).values({
    orgId, fullName, email: email ?? null, phone: phone ?? null, lat, lng,
    hasVehicle: hasVehicle ?? false, availabilityStatus: availabilityStatus ?? "Available",
  }).returning();
  res.status(201).json({ ...volunteer, activeTasks: 0 });
});

// PATCH /api/volunteers/:volunteerId
router.patch("/:volunteerId", requireAuth, requireOrg, async (req, res) => {
  const volunteerId = req.params.volunteerId as string;
  const orgId = (req as any).orgId as string;
  const { fullName, email, phone, lat, lng, hasVehicle, availabilityStatus } = req.body;
  const [volunteer] = await db.update(volunteersTable)
    .set({ ...(fullName && { fullName }), ...(email !== undefined && { email }), ...(phone !== undefined && { phone }), ...(lat !== undefined && { lat }), ...(lng !== undefined && { lng }), ...(hasVehicle !== undefined && { hasVehicle }), ...(availabilityStatus && { availabilityStatus }) })
    .where(and(eq(volunteersTable.id, volunteerId), eq(volunteersTable.orgId, orgId)))
    .returning();
  if (!volunteer) { res.status(404).json({ error: "Volunteer not found" }); return; }
  const [count] = await db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(tasksTable)
    .where(and(eq(tasksTable.volunteerId, volunteer.id), inArray(tasksTable.status, ["Open", "Assigned", "In Progress"])));
  res.json({ ...volunteer, activeTasks: count?.count ?? 0 });
});

// DELETE /api/volunteers/:volunteerId
router.delete("/:volunteerId", requireAuth, requireOrg, async (req, res) => {
  const volunteerId = req.params.volunteerId as string;
  const orgId = (req as any).orgId as string;
  await db.delete(volunteersTable).where(and(eq(volunteersTable.id, volunteerId), eq(volunteersTable.orgId, orgId)));
  res.status(204).send();
});

export default router;
