import { Router } from "express";
import { db, organizationsTable, orgMembersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

// GET /api/orgs/me — get current user's org
router.get("/me", requireAuth, async (req, res) => {
  const userId = (req as any).userId as string;
  const [member] = await db
    .select({ member: orgMembersTable, org: organizationsTable })
    .from(orgMembersTable)
    .leftJoin(organizationsTable, eq(orgMembersTable.orgId, organizationsTable.id))
    .where(eq(orgMembersTable.userId, userId))
    .limit(1);

  if (!member) { res.json(null); return; }
  res.json({ ...member.org, myRole: member.member.role });
});

// POST /api/orgs — create org (first user becomes Admin)
router.post("/", requireAuth, async (req, res) => {
  const userId = (req as any).userId as string;
  const { name, description, userEmail, userFullName } = req.body;
  if (!name) { res.status(400).json({ error: "name is required" }); return; }

  // Check already in an org
  const [existing] = await db.select().from(orgMembersTable).where(eq(orgMembersTable.userId, userId));
  if (existing) { res.status(409).json({ error: "You are already in an organization" }); return; }

  const [org] = await db.insert(organizationsTable).values({ name, description, createdBy: userId }).returning();
  await db.insert(orgMembersTable).values({ orgId: org.id, userId, email: userEmail ?? "", fullName: userFullName ?? null, role: "Admin" });
  res.status(201).json({ ...org, myRole: "Admin" });
});

// POST /api/orgs/join — join via invite code
router.post("/join", requireAuth, async (req, res) => {
  const userId = (req as any).userId as string;
  const { inviteCode, userEmail, userFullName } = req.body;
  if (!inviteCode) { res.status(400).json({ error: "inviteCode is required" }); return; }

  const [existing] = await db.select().from(orgMembersTable).where(eq(orgMembersTable.userId, userId));
  if (existing) { res.status(409).json({ error: "You are already in an organization" }); return; }

  const [org] = await db.select().from(organizationsTable).where(eq(organizationsTable.inviteCode, inviteCode as string));
  if (!org) { res.status(404).json({ error: "Invalid invite code" }); return; }

  await db.insert(orgMembersTable).values({ orgId: org.id, userId, email: userEmail ?? "", fullName: userFullName ?? null, role: "Coordinator" });
  res.status(201).json({ ...org, myRole: "Coordinator" });
});

// GET /api/orgs/:orgId/members
router.get("/:orgId/members", requireAuth, async (req, res) => {
  const orgId = req.params.orgId as string;
  const members = await db.select().from(orgMembersTable).where(eq(orgMembersTable.orgId, orgId));
  res.json(members);
});

// PATCH /api/orgs/:orgId/members/:memberId — change role
router.patch("/:orgId/members/:memberId", requireAuth, async (req, res) => {
  const { role } = req.body;
  const memberId = req.params.memberId as string;
  const [member] = await db.update(orgMembersTable).set({ role }).where(eq(orgMembersTable.id, memberId)).returning();
  if (!member) { res.status(404).json({ error: "Member not found" }); return; }
  res.json(member);
});

// DELETE /api/orgs/:orgId/members/:memberId — remove member
router.delete("/:orgId/members/:memberId", requireAuth, async (req, res) => {
  const memberId = req.params.memberId as string;
  const orgId = req.params.orgId as string;
  await db.delete(orgMembersTable).where(and(eq(orgMembersTable.id, memberId), eq(orgMembersTable.orgId, orgId)));
  res.status(204).send();
});

// PATCH /api/orgs/:orgId — update org info
router.patch("/:orgId", requireAuth, async (req, res) => {
  const orgId = req.params.orgId as string;
  const { name, description } = req.body;
  const [org] = await db.update(organizationsTable)
    .set({ ...(name && { name }), ...(description !== undefined && { description }) })
    .where(eq(organizationsTable.id, orgId))
    .returning();
  res.json(org);
});

// POST /api/orgs/:orgId/invite — add member by email (invite)
router.post("/:orgId/invite", requireAuth, async (req, res) => {
  const orgId = req.params.orgId as string;
  const { email, fullName, role } = req.body;
  if (!email) { res.status(400).json({ error: "email is required" }); return; }

  // Check not already a member (by email)
  const [existing] = await db.select().from(orgMembersTable)
    .where(and(eq(orgMembersTable.orgId, orgId), eq(orgMembersTable.email, email as string)));
  if (existing) { res.status(409).json({ error: "This email is already a member" }); return; }

  const [member] = await db.insert(orgMembersTable).values({
    orgId,
    userId: `pending:${email}`,
    email,
    fullName: fullName ?? null,
    role: role ?? "Coordinator",
  }).returning();
  res.status(201).json(member);
});

export default router;
