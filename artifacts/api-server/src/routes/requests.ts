import { Router } from "express";
import { db, requestsTable, requestItemsTable, itemsTable, hubsTable, hubStockTable, transfersTable } from "@workspace/db";
import { eq, inArray } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { logActivity } from "../lib/activity";

const router = Router();

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// GET /api/requests
router.get("/", requireAuth, async (req, res) => {
  const { status, priority } = req.query as { status?: string; priority?: string };
  const rows = await db
    .select({
      id: requestsTable.id,
      requestingHubId: requestsTable.requestingHubId,
      priority: requestsTable.priority,
      status: requestsTable.status,
      notes: requestsTable.notes,
      createdBy: requestsTable.createdBy,
      createdAt: requestsTable.createdAt,
      requestingHub: {
        id: hubsTable.id,
        name: hubsTable.name,
        address: hubsTable.address,
        lat: hubsTable.lat,
        lng: hubsTable.lng,
        imageUrl: hubsTable.imageUrl,
        createdAt: hubsTable.createdAt,
      },
    })
    .from(requestsTable)
    .leftJoin(hubsTable, eq(requestsTable.requestingHubId, hubsTable.id))
    .orderBy(requestsTable.createdAt);

  let result = rows as any[];
  if (status) result = result.filter((r) => r.status === status);
  if (priority) result = result.filter((r) => r.priority === priority);
  res.json(result);
});

// POST /api/requests
router.post("/", requireAuth, async (req, res) => {
  const { requestingHubId, priority, status, notes, items } = req.body;
  if (!requestingHubId || !priority) {
    res.status(400).json({ error: "requestingHubId and priority are required" }); return;
  }
  const [request] = await db.insert(requestsTable).values({
    requestingHubId, priority, status: status ?? "Draft", notes: notes ?? null, createdBy: (req as any).userId,
  }).returning();
  if (items?.length) {
    await db.insert(requestItemsTable).values(
      items.map((i: any) => ({ requestId: request.id, itemId: i.itemId, quantityNeeded: i.quantityNeeded }))
    );
  }
  const [hub] = await db.select().from(hubsTable).where(eq(hubsTable.id, requestingHubId as string));
  await logActivity({ actorId: (req as any).userId, entityType: "request", entityId: request.id, action: "created", payload: { priority, status: request.status } });
  res.status(201).json({ ...request, requestingHub: hub });
});

// GET /api/requests/:requestId
router.get("/:requestId", requireAuth, async (req, res) => {
  const requestId = req.params.requestId as string;
  const [request] = await db
    .select({
      id: requestsTable.id,
      requestingHubId: requestsTable.requestingHubId,
      priority: requestsTable.priority,
      status: requestsTable.status,
      notes: requestsTable.notes,
      createdBy: requestsTable.createdBy,
      createdAt: requestsTable.createdAt,
      requestingHub: {
        id: hubsTable.id,
        name: hubsTable.name,
        address: hubsTable.address,
        lat: hubsTable.lat,
        lng: hubsTable.lng,
        imageUrl: hubsTable.imageUrl,
        createdAt: hubsTable.createdAt,
      },
    })
    .from(requestsTable)
    .leftJoin(hubsTable, eq(requestsTable.requestingHubId, hubsTable.id))
    .where(eq(requestsTable.id, requestId));
  if (!request) { res.status(404).json({ error: "Request not found" }); return; }

  const requestItems = await db
    .select({
      id: requestItemsTable.id,
      requestId: requestItemsTable.requestId,
      itemId: requestItemsTable.itemId,
      quantityNeeded: requestItemsTable.quantityNeeded,
      item: {
        id: itemsTable.id, name: itemsTable.name, category: itemsTable.category,
        barcode: itemsTable.barcode, unit: itemsTable.unit, imageUrl: itemsTable.imageUrl,
        tracksExpiry: itemsTable.tracksExpiry, createdAt: itemsTable.createdAt,
      },
    })
    .from(requestItemsTable)
    .leftJoin(itemsTable, eq(requestItemsTable.itemId, itemsTable.id))
    .where(eq(requestItemsTable.requestId, requestId));

  const transfers = await db.select().from(transfersTable).where(eq(transfersTable.requestId, requestId));
  res.json({ ...request, items: requestItems, transfers });
});

// PATCH /api/requests/:requestId
router.patch("/:requestId", requireAuth, async (req, res) => {
  const requestId = req.params.requestId as string;
  const { priority, status, notes } = req.body;
  const [request] = await db.update(requestsTable)
    .set({ ...(priority && { priority }), ...(status && { status }), ...(notes !== undefined && { notes }) })
    .where(eq(requestsTable.id, requestId))
    .returning();
  if (!request) { res.status(404).json({ error: "Request not found" }); return; }
  const [hub] = await db.select().from(hubsTable).where(eq(hubsTable.id, request.requestingHubId));
  await logActivity({ actorId: (req as any).userId, entityType: "request", entityId: request.id, action: "status_changed", payload: { status, priority } });
  res.json({ ...request, requestingHub: hub });
});

// GET /api/requests/:requestId/matching-hubs
router.get("/:requestId/matching-hubs", requireAuth, async (req, res) => {
  const requestId = req.params.requestId as string;
  const requestItems = await db
    .select({ itemId: requestItemsTable.itemId, quantityNeeded: requestItemsTable.quantityNeeded })
    .from(requestItemsTable)
    .where(eq(requestItemsTable.requestId, requestId));

  if (!requestItems.length) { res.json([]); return; }

  const [requestRow] = await db
    .select({ requestingHubId: requestsTable.requestingHubId })
    .from(requestsTable)
    .where(eq(requestsTable.id, requestId));

  const [requestingHub] = await db.select().from(hubsTable).where(eq(hubsTable.id, requestRow?.requestingHubId ?? ""));

  const itemIds = requestItems.map((i) => i.itemId);
  const stockRows = await db
    .select({
      hubId: hubStockTable.hubId,
      itemId: hubStockTable.itemId,
      quantity: hubStockTable.quantity,
      item: { id: itemsTable.id, name: itemsTable.name },
    })
    .from(hubStockTable)
    .leftJoin(itemsTable, eq(hubStockTable.itemId, itemsTable.id))
    .where(inArray(hubStockTable.itemId, itemIds));

  const stockByHub: Record<string, Record<string, { quantity: number; itemName: string }>> = {};
  for (const row of stockRows) {
    if (!stockByHub[row.hubId]) stockByHub[row.hubId] = {};
    const existing = stockByHub[row.hubId][row.itemId];
    if (existing) {
      existing.quantity += row.quantity;
    } else {
      stockByHub[row.hubId][row.itemId] = { quantity: row.quantity, itemName: row.item?.name ?? "" };
    }
  }

  const hubIds = Object.keys(stockByHub).filter((id) => id !== requestRow?.requestingHubId);
  if (!hubIds.length) { res.json([]); return; }

  const hubs = await db.select().from(hubsTable).where(inArray(hubsTable.id, hubIds));
  const matches = hubs
    .map((hub) => {
      const hubStock = stockByHub[hub.id] ?? {};
      const availableItems = requestItems.map((ri) => ({
        itemId: ri.itemId,
        itemName: hubStock[ri.itemId]?.itemName ?? "",
        availableQuantity: hubStock[ri.itemId]?.quantity ?? 0,
        requestedQuantity: ri.quantityNeeded,
      }));
      const canFulfillAll = availableItems.every((ai) => ai.availableQuantity >= ai.requestedQuantity);
      const distanceKm =
        hub.lat != null && hub.lng != null && requestingHub?.lat != null && requestingHub?.lng != null
          ? haversineKm(requestingHub.lat, requestingHub.lng, hub.lat, hub.lng)
          : 9999;
      return { hub, distanceKm, availableItems, canFulfillAll };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm);

  res.json(matches);
});

export default router;
