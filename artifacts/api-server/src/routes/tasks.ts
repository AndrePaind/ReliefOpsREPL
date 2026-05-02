import { Router } from "express";
import { db, tasksTable, volunteersTable } from "@workspace/db";
import { eq, and, inArray, sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { logActivity } from "../lib/activity";

const router = Router();

async function buildTask(task: any) {
  let volunteer = null;
  if (task.volunteerId) {
    const [v] = await db.select().from(volunteersTable).where(eq(volunteersTable.id, task.volunteerId));
    if (v) {
      const [count] = await db
        .select({ count: sql<number>`count(*)`.mapWith(Number) })
        .from(tasksTable)
        .where(and(eq(tasksTable.volunteerId, v.id), inArray(tasksTable.status, ["Open", "Assigned", "In Progress"])));
      volunteer = { ...v, activeTasks: count?.count ?? 0 };
    }
  }
  return { ...task, volunteer };
}

// GET /api/tasks
router.get("/", requireAuth, async (req, res) => {
  const { volunteerId, transferId, status } = req.query as { volunteerId?: string; transferId?: string; status?: string };
  let rows = await db.select().from(tasksTable).orderBy(tasksTable.createdAt);
  if (volunteerId) rows = rows.filter((r) => r.volunteerId === volunteerId);
  if (transferId) rows = rows.filter((r) => r.transferId === transferId);
  if (status) rows = rows.filter((r) => r.status === status);
  const result = await Promise.all(rows.map(buildTask));
  res.json(result);
});

// POST /api/tasks
router.post("/", requireAuth, async (req, res) => {
  const { transferId, volunteerId, type, startsAt, endsAt } = req.body;
  if (!type) { res.status(400).json({ error: "type is required" }); return; }
  const [task] = await db.insert(tasksTable).values({
    transferId: transferId ?? null,
    volunteerId: volunteerId ?? null,
    type,
    status: volunteerId ? "Assigned" : "Open",
    startsAt: startsAt ? new Date(startsAt) : null,
    endsAt: endsAt ? new Date(endsAt) : null,
  }).returning();
  await logActivity({ actorId: (req as any).userId, entityType: "task", entityId: task.id, action: "created", payload: { type, volunteerId } });
  res.status(201).json(await buildTask(task));
});

// PATCH /api/tasks/:taskId
router.patch("/:taskId", requireAuth, async (req, res) => {
  const { volunteerId, status, startsAt, endsAt } = req.body;
  const [task] = await db.update(tasksTable)
    .set({ ...(volunteerId !== undefined && { volunteerId }), ...(status && { status }), ...(startsAt !== undefined && { startsAt: startsAt ? new Date(startsAt) : null }), ...(endsAt !== undefined && { endsAt: endsAt ? new Date(endsAt) : null }) })
    .where(eq(tasksTable.id, req.params.taskId as string))
    .returning();
  if (!task) { res.status(404).json({ error: "Task not found" }); return; }
  await logActivity({ actorId: (req as any).userId, entityType: "task", entityId: task.id, action: "updated", payload: { volunteerId, status } });
  res.json(await buildTask(task));
});

export default router;
