import { Router } from "express";
import { db, activityLogTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { requireOrg } from "../lib/requireOrg";

const router = Router();

// GET /api/activity
router.get("/", requireAuth, requireOrg, async (req, res) => {
  const orgId = (req as any).orgId as string;
  const limit = parseInt((req.query.limit as string) ?? "50", 10);
  const entityType = req.query.entityType as string | undefined;

  let rows = await db.select().from(activityLogTable)
    .where(eq(activityLogTable.orgId, orgId))
    .orderBy(desc(activityLogTable.createdAt))
    .limit(limit);
  if (entityType) rows = rows.filter((r) => r.entityType === entityType);
  res.json(rows);
});

export default router;
