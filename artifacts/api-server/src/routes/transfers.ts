import { Router } from "express";
import { db, transfersTable, transferItemsTable, hubsTable, itemsTable, hubStockTable, tasksTable, volunteersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { logActivity } from "../lib/activity";

const router = Router();

async function buildTransfer(transfer: any) {
  const [fromHub] = await db.select().from(hubsTable).where(eq(hubsTable.id, transfer.fromHubId as string));
  const [toHub] = await db.select().from(hubsTable).where(eq(hubsTable.id, transfer.toHubId as string));
  return { ...transfer, fromHub, toHub };
}

// GET /api/transfers
router.get("/", requireAuth, async (req, res) => {
  const { status, requestId } = req.query as { status?: string; requestId?: string };
  const rows = await db
    .select({
      id: transfersTable.id,
      requestId: transfersTable.requestId,
      fromHubId: transfersTable.fromHubId,
      toHubId: transfersTable.toHubId,
      status: transfersTable.status,
      etaMinutes: transfersTable.etaMinutes,
      createdBy: transfersTable.createdBy,
      createdAt: transfersTable.createdAt,
    })
    .from(transfersTable)
    .orderBy(transfersTable.createdAt);

  let filtered = rows as any[];
  if (status) filtered = filtered.filter((r) => r.status === status);
  if (requestId) filtered = filtered.filter((r) => r.requestId === requestId);
  const result = await Promise.all(filtered.map(buildTransfer));
  res.json(result);
});

// POST /api/transfers
router.post("/", requireAuth, async (req, res) => {
  const { requestId, fromHubId, toHubId, etaMinutes, items } = req.body;
  if (!requestId || !fromHubId || !toHubId || !items?.length) {
    res.status(400).json({ error: "requestId, fromHubId, toHubId, and items are required" }); return;
  }
  const [transfer] = await db.insert(transfersTable).values({
    requestId, fromHubId, toHubId, etaMinutes: etaMinutes ?? null,
    status: "Planned", createdBy: (req as any).userId,
  }).returning();
  await db.insert(transferItemsTable).values(
    items.map((i: any) => ({ transferId: transfer.id, itemId: i.itemId, quantity: i.quantity }))
  );
  await logActivity({ actorId: (req as any).userId, entityType: "transfer", entityId: transfer.id, action: "created", payload: { requestId, fromHubId, toHubId } });
  res.status(201).json(await buildTransfer(transfer));
});

// GET /api/transfers/:transferId
router.get("/:transferId", requireAuth, async (req, res) => {
  const transferId = req.params.transferId as string;
  const [transfer] = await db.select().from(transfersTable).where(eq(transfersTable.id, transferId));
  if (!transfer) { res.status(404).json({ error: "Transfer not found" }); return; }

  const transferItems = await db
    .select({
      id: transferItemsTable.id,
      transferId: transferItemsTable.transferId,
      itemId: transferItemsTable.itemId,
      quantity: transferItemsTable.quantity,
      item: {
        id: itemsTable.id, name: itemsTable.name, category: itemsTable.category,
        barcode: itemsTable.barcode, unit: itemsTable.unit, imageUrl: itemsTable.imageUrl,
        tracksExpiry: itemsTable.tracksExpiry, createdAt: itemsTable.createdAt,
      },
    })
    .from(transferItemsTable)
    .leftJoin(itemsTable, eq(transferItemsTable.itemId, itemsTable.id))
    .where(eq(transferItemsTable.transferId, transferId));

  const tasks = await db
    .select({
      id: tasksTable.id, transferId: tasksTable.transferId, volunteerId: tasksTable.volunteerId,
      type: tasksTable.type, status: tasksTable.status, startsAt: tasksTable.startsAt,
      endsAt: tasksTable.endsAt, createdAt: tasksTable.createdAt,
      volunteer: {
        id: volunteersTable.id, fullName: volunteersTable.fullName,
        hasVehicle: volunteersTable.hasVehicle, availabilityStatus: volunteersTable.availabilityStatus,
      },
    })
    .from(tasksTable)
    .leftJoin(volunteersTable, eq(tasksTable.volunteerId, volunteersTable.id))
    .where(eq(tasksTable.transferId, transferId));

  res.json({ ...(await buildTransfer(transfer)), items: transferItems, tasks });
});

// PATCH /api/transfers/:transferId — status change triggers stock reduction on "Dispatched"
router.patch("/:transferId", requireAuth, async (req, res) => {
  const transferId = req.params.transferId as string;
  const { status, etaMinutes } = req.body;

  const [existing] = await db.select().from(transfersTable).where(eq(transfersTable.id, transferId));
  if (!existing) { res.status(404).json({ error: "Transfer not found" }); return; }

  const [transfer] = await db.update(transfersTable)
    .set({ ...(status && { status }), ...(etaMinutes !== undefined && { etaMinutes }) })
    .where(eq(transfersTable.id, transferId))
    .returning();

  if (status === "Dispatched" && existing.status !== "Dispatched") {
    const items = await db.select().from(transferItemsTable).where(eq(transferItemsTable.transferId, transferId));
    for (const item of items) {
      await db.execute(
        sql`UPDATE hub_stock SET quantity = GREATEST(0, quantity - ${item.quantity}), updated_at = NOW() WHERE hub_id = ${existing.fromHubId} AND item_id = ${item.itemId}`
      );
    }
    await logActivity({ actorId: (req as any).userId, entityType: "transfer", entityId: transfer.id, action: "dispatched", payload: { fromHubId: existing.fromHubId } });
  } else {
    await logActivity({ actorId: (req as any).userId, entityType: "transfer", entityId: transfer.id, action: "status_changed", payload: { status } });
  }

  res.json(await buildTransfer(transfer));
});

export default router;
