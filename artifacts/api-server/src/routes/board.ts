import { Router } from "express";
import { db, boardPostsTable, organizationsTable, orgMembersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { requireOrg } from "../lib/requireOrg";

const router = Router();

// GET /api/board — all active posts (public to all authenticated orgs)
router.get("/", requireAuth, requireOrg, async (req, res) => {
  const { type, status } = req.query as { type?: string; status?: string };
  let rows = await db.select().from(boardPostsTable).orderBy(desc(boardPostsTable.createdAt));
  if (type) rows = rows.filter((r) => r.type === type);
  if (status) rows = rows.filter((r) => r.status === status);
  else rows = rows.filter((r) => r.status === "Active");
  res.json(rows);
});

// POST /api/board
router.post("/", requireAuth, requireOrg, async (req, res) => {
  const orgId = (req as any).orgId as string;
  const { title, type, content, itemName, quantity, location } = req.body;
  if (!title || !type) { res.status(400).json({ error: "title and type are required" }); return; }

  const [org] = await db.select().from(organizationsTable).where(eq(organizationsTable.id, orgId));
  const [post] = await db.insert(boardPostsTable).values({
    orgId,
    orgName: org?.name ?? "Unknown NGO",
    type,
    title,
    content: content ?? null,
    itemName: itemName ?? null,
    quantity: quantity ?? null,
    location: location ?? null,
    status: "Active",
    createdBy: (req as any).userId,
  }).returning();
  res.status(201).json(post);
});

// PATCH /api/board/:postId
router.patch("/:postId", requireAuth, requireOrg, async (req, res) => {
  const postId = req.params.postId as string;
  const orgId = (req as any).orgId as string;
  const { status, title, content } = req.body;
  const [post] = await db.update(boardPostsTable)
    .set({ ...(status && { status }), ...(title && { title }), ...(content !== undefined && { content }) })
    .where(eq(boardPostsTable.id, postId))
    .returning();
  if (!post || post.orgId !== orgId) { res.status(404).json({ error: "Post not found" }); return; }
  res.json(post);
});

// DELETE /api/board/:postId
router.delete("/:postId", requireAuth, requireOrg, async (req, res) => {
  const postId = req.params.postId as string;
  await db.delete(boardPostsTable).where(eq(boardPostsTable.id, postId));
  res.status(204).send();
});

export default router;
