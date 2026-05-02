import { Router } from "express";
import { db, requestsTable, transfersTable, volunteersTable, hubsTable, hubStockTable, activityLogTable, itemsTable } from "@workspace/db";
import { eq, inArray, sql, desc } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

// GET /api/dashboard/summary
router.get("/summary", requireAuth, async (req, res) => {
  const [hubCount] = await db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(hubsTable);
  const [urgentCount] = await db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(requestsTable)
    .where(inArray(requestsTable.priority, ["Urgent", "Critical"]));
  const [activeTransfers] = await db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(transfersTable)
    .where(inArray(transfersTable.status, ["Planned", "Dispatched"]));
  const [availableVols] = await db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(volunteersTable)
    .where(eq(volunteersTable.availabilityStatus, "Available"));

  // Low stock = quantity < 10
  const [lowStockCount] = await db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(hubStockTable)
    .where(sql`quantity < 10 AND quantity > 0`);

  // Requests by status
  const byStatus = await db.select({ status: requestsTable.status, count: sql<number>`count(*)`.mapWith(Number) })
    .from(requestsTable).groupBy(requestsTable.status);
  const requestsByStatus: Record<string, number> = {};
  for (const r of byStatus) requestsByStatus[r.status] = r.count;

  // Requests by priority
  const byPriority = await db.select({ priority: requestsTable.priority, count: sql<number>`count(*)`.mapWith(Number) })
    .from(requestsTable).groupBy(requestsTable.priority);
  const requestsByPriority: Record<string, number> = {};
  for (const r of byPriority) requestsByPriority[r.priority] = r.count;

  // Recent activity (last 10)
  const recentActivity = await db.select().from(activityLogTable).orderBy(desc(activityLogTable.createdAt)).limit(10);

  res.json({
    totalHubs: hubCount?.count ?? 0,
    urgentRequests: urgentCount?.count ?? 0,
    activeTransfers: activeTransfers?.count ?? 0,
    availableVolunteers: availableVols?.count ?? 0,
    lowStockCount: lowStockCount?.count ?? 0,
    requestsByStatus,
    requestsByPriority,
    recentActivity,
  });
});

// GET /api/dashboard/low-stock
router.get("/low-stock", requireAuth, async (req, res) => {
  const rows = await db
    .select({
      hubId: hubStockTable.hubId,
      hubName: hubsTable.name,
      itemId: hubStockTable.itemId,
      itemName: itemsTable.name,
      category: itemsTable.category,
      quantity: hubStockTable.quantity,
      expiryDate: hubStockTable.expiryDate,
    })
    .from(hubStockTable)
    .leftJoin(hubsTable, eq(hubStockTable.hubId, hubsTable.id))
    .leftJoin(itemsTable, eq(hubStockTable.itemId, itemsTable.id))
    .where(sql`hub_stock.quantity < 10 AND hub_stock.quantity > 0`)
    .orderBy(hubStockTable.quantity);
  res.json(rows);
});

export default router;
