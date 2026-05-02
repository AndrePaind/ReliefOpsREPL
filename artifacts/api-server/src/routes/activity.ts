import { Router } from "express";
import { db, activityLogTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

// GET /api/activity
router.get("/", requireAuth, async (req, res) => {
  const limit = parseInt((req.query.limit as string) ?? "50", 10);
  const entityType = req.query.entityType as string | undefined;

  let rows = await db.select().from(activityLogTable).orderBy(desc(activityLogTable.createdAt)).limit(limit);
  if (entityType) rows = rows.filter((r) => r.entityType === entityType);
  res.json(rows);
});

export default router;
