import { Router } from "express";
import { db, hubsTable, hubStockTable, itemsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { requireOrg } from "../lib/requireOrg";
import { logActivity } from "../lib/activity";

const router = Router();

// GET /api/hubs
router.get("/", requireAuth, requireOrg, async (req, res) => {
  const orgId = (req as any).orgId as string;
  const hubs = await db.select().from(hubsTable).where(eq(hubsTable.orgId, orgId)).orderBy(hubsTable.name);
  res.json(hubs);
});

// POST /api/hubs
router.post("/", requireAuth, requireOrg, async (req, res) => {
  const orgId = (req as any).orgId as string;
  const { name, address, lat, lng, imageUrl } = req.body;
  if (!name) { res.status(400).json({ error: "name is required" }); return; }
  const [hub] = await db.insert(hubsTable).values({ orgId, name, address, lat, lng, imageUrl }).returning();
  await logActivity({ orgId, actorId: (req as any).userId, entityType: "hub", entityId: hub.id, action: "created", payload: { name } });
  res.status(201).json(hub);
});

// GET /api/hubs/:hubId
router.get("/:hubId", requireAuth, requireOrg, async (req, res) => {
  const hubId = req.params.hubId as string;
  const orgId = (req as any).orgId as string;
  const [hub] = await db.select().from(hubsTable).where(and(eq(hubsTable.id, hubId), eq(hubsTable.orgId, orgId)));
  if (!hub) { res.status(404).json({ error: "Hub not found" }); return; }
  res.json(hub);
});

// PATCH /api/hubs/:hubId
router.patch("/:hubId", requireAuth, requireOrg, async (req, res) => {
  const hubId = req.params.hubId as string;
  const orgId = (req as any).orgId as string;
  const { name, address, lat, lng, imageUrl } = req.body;
  const [hub] = await db.update(hubsTable)
    .set({ ...(name && { name }), ...(address !== undefined && { address }), ...(lat !== undefined && { lat }), ...(lng !== undefined && { lng }), ...(imageUrl !== undefined && { imageUrl }) })
    .where(and(eq(hubsTable.id, hubId), eq(hubsTable.orgId, orgId)))
    .returning();
  if (!hub) { res.status(404).json({ error: "Hub not found" }); return; }
  await logActivity({ orgId, actorId: (req as any).userId, entityType: "hub", entityId: hub.id, action: "updated" });
  res.json(hub);
});

// GET /api/hubs/:hubId/stock
router.get("/:hubId/stock", requireAuth, requireOrg, async (req, res) => {
  const hubId = req.params.hubId as string;
  const stock = await db
    .select({
      id: hubStockTable.id, hubId: hubStockTable.hubId, itemId: hubStockTable.itemId,
      quantity: hubStockTable.quantity, expiryDate: hubStockTable.expiryDate, updatedAt: hubStockTable.updatedAt,
      item: { id: itemsTable.id, name: itemsTable.name, category: itemsTable.category, barcode: itemsTable.barcode, unit: itemsTable.unit, imageUrl: itemsTable.imageUrl, tracksExpiry: itemsTable.tracksExpiry, createdAt: itemsTable.createdAt },
    })
    .from(hubStockTable)
    .leftJoin(itemsTable, eq(hubStockTable.itemId, itemsTable.id))
    .where(eq(hubStockTable.hubId, hubId))
    .orderBy(itemsTable.name);
  res.json(stock);
});

// POST /api/hubs/:hubId/stock — upsert
router.post("/:hubId/stock", requireAuth, requireOrg, async (req, res) => {
  const hubId = req.params.hubId as string;
  const orgId = (req as any).orgId as string;
  const { itemId, quantity, expiryDate } = req.body;
  if (!itemId || quantity === undefined) { res.status(400).json({ error: "itemId and quantity are required" }); return; }
  const [entry] = await db.insert(hubStockTable)
    .values({ hubId, itemId, quantity, expiryDate: expiryDate ?? null, updatedBy: (req as any).userId })
    .onConflictDoUpdate({ target: [hubStockTable.hubId, hubStockTable.itemId], set: { quantity, expiryDate: expiryDate ?? null, updatedAt: new Date(), updatedBy: (req as any).userId } })
    .returning();
  const [item] = await db.select().from(itemsTable).where(eq(itemsTable.id, itemId as string));
  await logActivity({ orgId, actorId: (req as any).userId, entityType: "stock", entityId: entry.id, action: "upserted", payload: { hubId, itemId, quantity } });
  res.json({ ...entry, item });
});

// PATCH /api/hubs/:hubId/stock/:stockId
router.patch("/:hubId/stock/:stockId", requireAuth, requireOrg, async (req, res) => {
  const stockId = req.params.stockId as string;
  const { quantity, expiryDate } = req.body;
  const [entry] = await db.update(hubStockTable)
    .set({ ...(quantity !== undefined && { quantity }), ...(expiryDate !== undefined && { expiryDate }), updatedAt: new Date(), updatedBy: (req as any).userId })
    .where(eq(hubStockTable.id, stockId))
    .returning();
  if (!entry) { res.status(404).json({ error: "Stock entry not found" }); return; }
  const [item] = await db.select().from(itemsTable).where(eq(itemsTable.id, entry.itemId));
  res.json({ ...entry, item });
});

// DELETE /api/hubs/:hubId/stock/:stockId
router.delete("/:hubId/stock/:stockId", requireAuth, requireOrg, async (req, res) => {
  const stockId = req.params.stockId as string;
  await db.delete(hubStockTable).where(eq(hubStockTable.id, stockId));
  res.status(204).send();
});

export default router;
