import { Router } from "express";
import { db, requestsTable, transfersTable, volunteersTable, hubsTable, hubStockTable, activityLogTable, itemsTable } from "@workspace/db";
import { eq, inArray, sql, desc, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { requireOrg } from "../lib/requireOrg";

const router = Router();

// GET /api/dashboard/summary
router.get("/summary", requireAuth, requireOrg, async (req, res) => {
  const orgId = (req as any).orgId as string;

  const [hubCount] = await db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(hubsTable).where(eq(hubsTable.orgId, orgId));
  const [urgentCount] = await db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(requestsTable)
    .where(and(eq(requestsTable.orgId, orgId), inArray(requestsTable.priority, ["Urgent", "Critical"])));
  const [activeTransfers] = await db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(transfersTable)
    .where(and(eq(transfersTable.orgId, orgId), inArray(transfersTable.status, ["Planned", "Dispatched"])));
  const [availableVols] = await db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(volunteersTable)
    .where(and(eq(volunteersTable.orgId, orgId), eq(volunteersTable.availabilityStatus, "Available")));

  // Low stock from org's hubs
  const orgHubs = await db.select({ id: hubsTable.id }).from(hubsTable).where(eq(hubsTable.orgId, orgId));
  const hubIds = orgHubs.map((h) => h.id);
  const lowStockCount = hubIds.length > 0
    ? (await db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(hubStockTable)
        .where(and(inArray(hubStockTable.hubId, hubIds), sql`quantity < 10 AND quantity > 0`)))[0]?.count ?? 0
    : 0;

  const byStatus = await db.select({ status: requestsTable.status, count: sql<number>`count(*)`.mapWith(Number) })
    .from(requestsTable).where(eq(requestsTable.orgId, orgId)).groupBy(requestsTable.status);
  const requestsByStatus: Record<string, number> = {};
  for (const r of byStatus) requestsByStatus[r.status] = r.count;

  const byPriority = await db.select({ priority: requestsTable.priority, count: sql<number>`count(*)`.mapWith(Number) })
    .from(requestsTable).where(eq(requestsTable.orgId, orgId)).groupBy(requestsTable.priority);
  const requestsByPriority: Record<string, number> = {};
  for (const r of byPriority) requestsByPriority[r.priority] = r.count;

  const recentActivity = await db.select().from(activityLogTable)
    .where(eq(activityLogTable.orgId, orgId))
    .orderBy(desc(activityLogTable.createdAt)).limit(10);

  res.json({
    totalHubs: hubCount?.count ?? 0,
    urgentRequests: urgentCount?.count ?? 0,
    activeTransfers: activeTransfers?.count ?? 0,
    availableVolunteers: availableVols?.count ?? 0,
    lowStockCount,
    requestsByStatus,
    requestsByPriority,
    recentActivity,
  });
});

// GET /api/dashboard/low-stock
router.get("/low-stock", requireAuth, requireOrg, async (req, res) => {
  const orgId = (req as any).orgId as string;
  const orgHubs = await db.select({ id: hubsTable.id }).from(hubsTable).where(eq(hubsTable.orgId, orgId));
  const hubIds = orgHubs.map((h) => h.id);
  if (!hubIds.length) { res.json([]); return; }
  const rows = await db
    .select({ hubId: hubStockTable.hubId, hubName: hubsTable.name, itemId: hubStockTable.itemId, itemName: itemsTable.name, category: itemsTable.category, quantity: hubStockTable.quantity, expiryDate: hubStockTable.expiryDate })
    .from(hubStockTable)
    .leftJoin(hubsTable, eq(hubStockTable.hubId, hubsTable.id))
    .leftJoin(itemsTable, eq(hubStockTable.itemId, itemsTable.id))
    .where(and(inArray(hubStockTable.hubId, hubIds), sql`hub_stock.quantity < 10 AND hub_stock.quantity > 0`))
    .orderBy(hubStockTable.quantity);
  res.json(rows);
});

export default router;
