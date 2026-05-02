import { Router } from "express";
import { db, itemsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

// GET /api/items
router.get("/", requireAuth, async (req, res) => {
  const { category } = req.query as { category?: string };
  const items = category
    ? await db.select().from(itemsTable).where(eq(itemsTable.category, category as any)).orderBy(itemsTable.name)
    : await db.select().from(itemsTable).orderBy(itemsTable.name);
  res.json(items);
});

// POST /api/items
router.post("/", requireAuth, async (req, res) => {
  const { name, category, barcode, unit, imageUrl, tracksExpiry } = req.body;
  if (!name || !category) {
    res.status(400).json({ error: "name and category are required" }); return;
  }
  const [item] = await db.insert(itemsTable).values({
    name, category, barcode, unit: unit ?? "units", imageUrl,
    tracksExpiry: tracksExpiry ?? false,
  }).returning();
  res.status(201).json(item);
});

// GET /api/items/:itemId
router.get("/:itemId", requireAuth, async (req, res) => {
  const itemId = req.params.itemId as string;
  const [item] = await db.select().from(itemsTable).where(eq(itemsTable.id, itemId));
  if (!item) { res.status(404).json({ error: "Item not found" }); return; }
  res.json(item);
});

// PATCH /api/items/:itemId
router.patch("/:itemId", requireAuth, async (req, res) => {
  const itemId = req.params.itemId as string;
  const { name, category, barcode, unit, imageUrl, tracksExpiry } = req.body;
  const [item] = await db.update(itemsTable)
    .set({ ...(name && { name }), ...(category && { category }), ...(barcode !== undefined && { barcode }), ...(unit && { unit }), ...(imageUrl !== undefined && { imageUrl }), ...(tracksExpiry !== undefined && { tracksExpiry }) })
    .where(eq(itemsTable.id, itemId))
    .returning();
  if (!item) { res.status(404).json({ error: "Item not found" }); return; }
  res.json(item);
});

export default router;
