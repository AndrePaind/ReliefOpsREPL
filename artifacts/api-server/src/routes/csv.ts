import { Router } from "express";
import { db, hubsTable, itemsTable, hubStockTable } from "@workspace/db";
import { eq, and, ilike } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { logActivity } from "../lib/activity";

const router = Router();

// POST /api/stock/csv-import
router.post("/csv-import", requireAuth, async (req, res) => {
  const { rows } = req.body as {
    rows: { hubName: string; itemName: string; category: string; quantity: number; unit?: string; expiryDate?: string; barcode?: string }[];
  };

  if (!rows?.length) {
    res.status(400).json({ error: "rows array is required" });
    return;
  }

  let imported = 0;
  let updated = 0;
  let skipped = 0;
  const duplicateWarnings: string[] = [];
  const errors: string[] = [];

  for (const row of rows) {
    try {
      // Find or create hub
      let [hub] = await db.select().from(hubsTable).where(ilike(hubsTable.name, row.hubName));
      if (!hub) {
        [hub] = await db.insert(hubsTable).values({ name: row.hubName }).returning();
      }

      // Determine category
      const validCategories = ["Medicine", "Food", "Hygiene", "First Aid"];
      const category = validCategories.includes(row.category) ? row.category : "Hygiene";
      const tracksExpiry = ["Medicine", "Food"].includes(category);

      // Find or create item — match by barcode first, then name+category
      let item = null;
      if (row.barcode) {
        const [byBarcode] = await db.select().from(itemsTable).where(eq(itemsTable.barcode, row.barcode));
        if (byBarcode) item = byBarcode;
      }
      if (!item) {
        const [byName] = await db.select().from(itemsTable)
          .where(and(ilike(itemsTable.name, row.itemName), eq(itemsTable.category, category as any)));
        if (byName) {
          item = byName;
          if (row.barcode && !byName.barcode) {
            duplicateWarnings.push(`Possible duplicate: "${row.itemName}" matched by name but barcode differs`);
          }
        }
      }
      if (!item) {
        const [created] = await db.insert(itemsTable).values({
          name: row.itemName,
          category: category as any,
          barcode: row.barcode ?? null,
          unit: row.unit ?? "units",
          tracksExpiry,
        }).returning();
        item = created;
      }

      // Upsert stock
      const expiryDate = row.expiryDate && row.expiryDate.trim() ? row.expiryDate : null;
      const existing = await db.select().from(hubStockTable)
        .where(and(eq(hubStockTable.hubId, hub.id), eq(hubStockTable.itemId, item.id)));

      if (existing.length > 0) {
        await db.update(hubStockTable)
          .set({ quantity: row.quantity, expiryDate, updatedAt: new Date() })
          .where(and(eq(hubStockTable.hubId, hub.id), eq(hubStockTable.itemId, item.id)));
        updated++;
      } else {
        await db.insert(hubStockTable).values({ hubId: hub.id, itemId: item.id, quantity: row.quantity, expiryDate });
        imported++;
      }
    } catch (err: any) {
      errors.push(`Row "${row.itemName}": ${err.message ?? "unknown error"}`);
      skipped++;
    }
  }

  await logActivity({
    actorId: (req as any).userId,
    entityType: "stock",
    entityId: "csv-import",
    action: "csv_imported",
    payload: { imported, updated, skipped, rowCount: rows.length },
  });

  res.json({ imported, updated, skipped, duplicateWarnings, errors });
});

export default router;
