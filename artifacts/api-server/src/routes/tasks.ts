import { Router } from "express";
import { db, tasksTable, volunteersTable, organizationsTable } from "@workspace/db";
import { eq, and, inArray, sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { requireOrg } from "../lib/requireOrg";
import { logActivity } from "../lib/activity";
import { sendTaskAssignmentEmail } from "../lib/email";

const router = Router();

async function buildTask(task: any) {
  let volunteer = null;
  if (task.volunteerId) {
    const [v] = await db.select().from(volunteersTable).where(eq(volunteersTable.id, task.volunteerId as string));
    if (v) {
      const [count] = await db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(tasksTable)
        .where(and(eq(tasksTable.volunteerId, v.id), inArray(tasksTable.status, ["Open", "Assigned", "In Progress"])));
      volunteer = { ...v, activeTasks: count?.count ?? 0 };
    }
  }
  return { ...task, volunteer };
}

// GET /api/tasks
router.get("/", requireAuth, requireOrg, async (req, res) => {
  const orgId = (req as any).orgId as string;
  const { volunteerId, transferId, status } = req.query as { volunteerId?: string; transferId?: string; status?: string };
  let rows = await db.select().from(tasksTable).where(eq(tasksTable.orgId, orgId)).orderBy(tasksTable.createdAt);
  if (volunteerId) rows = rows.filter((r) => r.volunteerId === volunteerId);
  if (transferId) rows = rows.filter((r) => r.transferId === transferId);
  if (status) rows = rows.filter((r) => r.status === status);
  const result = await Promise.all(rows.map(buildTask));
  res.json(result);
});

// POST /api/tasks
router.post("/", requireAuth, requireOrg, async (req, res) => {
  const orgId = (req as any).orgId as string;
  const { transferId, volunteerId, type, startsAt, endsAt } = req.body;
  if (!type) { res.status(400).json({ error: "type is required" }); return; }
  const [task] = await db.insert(tasksTable).values({
    orgId,
    transferId: transferId ?? null,
    volunteerId: volunteerId ?? null,
    type,
    status: volunteerId ? "Assigned" : "Open",
    startsAt: startsAt ? new Date(startsAt) : null,
    endsAt: endsAt ? new Date(endsAt) : null,
  }).returning();

  // Send email notification if volunteer has an email
  if (volunteerId) {
    const [volunteer] = await db.select().from(volunteersTable).where(eq(volunteersTable.id, volunteerId as string));
    if (volunteer?.email) {
      const [org] = await db.select({ name: organizationsTable.name })
        .from(organizationsTable).where(eq(organizationsTable.id, orgId));
      sendTaskAssignmentEmail({
        volunteerEmail: volunteer.email,
        volunteerName: volunteer.fullName,
        taskType: type,
        orgName: org?.name ?? "ReliefOps",
        startsAt: task.startsAt,
      }).catch(() => {});
    }
  }

  await logActivity({ orgId, actorId: (req as any).userId, entityType: "task", entityId: task.id, action: "created", payload: { type, volunteerId } });
  res.status(201).json(await buildTask(task));
});

// PATCH /api/tasks/:taskId
router.patch("/:taskId", requireAuth, requireOrg, async (req, res) => {
  const taskId = req.params.taskId as string;
  const orgId = (req as any).orgId as string;
  const { volunteerId, status, startsAt, endsAt } = req.body;
  const [task] = await db.update(tasksTable)
    .set({ ...(volunteerId !== undefined && { volunteerId }), ...(status && { status }), ...(startsAt !== undefined && { startsAt: startsAt ? new Date(startsAt) : null }), ...(endsAt !== undefined && { endsAt: endsAt ? new Date(endsAt) : null }) })
    .where(and(eq(tasksTable.id, taskId), eq(tasksTable.orgId, orgId)))
    .returning();
  if (!task) { res.status(404).json({ error: "Task not found" }); return; }

  // Send email if volunteer was just assigned
  if (volunteerId && task.volunteerId === volunteerId) {
    const [volunteer] = await db.select().from(volunteersTable).where(eq(volunteersTable.id, volunteerId as string));
    if (volunteer?.email) {
      const [org] = await db.select({ name: organizationsTable.name }).from(organizationsTable).where(eq(organizationsTable.id, orgId));
      sendTaskAssignmentEmail({
        volunteerEmail: volunteer.email,
        volunteerName: volunteer.fullName,
        taskType: task.type,
        orgName: org?.name ?? "ReliefOps",
        startsAt: task.startsAt,
      }).catch(() => {});
    }
  }

  await logActivity({ orgId, actorId: (req as any).userId, entityType: "task", entityId: task.id, action: "updated", payload: { volunteerId, status } });
  res.json(await buildTask(task));
});

export default router;
