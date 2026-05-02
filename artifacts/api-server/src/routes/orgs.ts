import { Router } from "express";
import { db, organizationsTable, orgMembersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

// GET /api/orgs/my-orgs — all orgs the user belongs to
router.get("/my-orgs", requireAuth, async (req, res) => {
  const userId = (req as any).userId as string;
  const rows = await db
    .select({ member: orgMembersTable, org: organizationsTable })
    .from(orgMembersTable)
    .leftJoin(organizationsTable, eq(orgMembersTable.orgId, organizationsTable.id))
    .where(eq(orgMembersTable.userId, userId));

  res.json(rows.filter((r) => r.org).map((r) => ({ ...r.org!, myRole: r.member.role })));
});

// GET /api/orgs/me — current active org (respects x-org-id header)
router.get("/me", requireAuth, async (req, res) => {
  const userId = (req as any).userId as string;
  const requestedOrgId = req.headers["x-org-id"] as string | undefined;

  const rows = await db
    .select({ member: orgMembersTable, org: organizationsTable })
    .from(orgMembersTable)
    .leftJoin(organizationsTable, eq(orgMembersTable.orgId, organizationsTable.id))
    .where(eq(orgMembersTable.userId, userId));

  if (!rows.length) { res.json(null); return; }

  // Prefer the requested org if the user is a member, else first
  const chosen = (requestedOrgId && rows.find((r) => r.org?.id === requestedOrgId)) || rows[0];
  res.json({ ...chosen.org!, myRole: chosen.member.role });
});

// POST /api/orgs — create org (user becomes Admin; can be in multiple orgs)
router.post("/", requireAuth, async (req, res) => {
  const userId = (req as any).userId as string;
  const { name, description, userEmail, userFullName } = req.body;
  if (!name) { res.status(400).json({ error: "name is required" }); return; }

  const [org] = await db.insert(organizationsTable).values({ name, description, createdBy: userId }).returning();
  await db.insert(orgMembersTable).values({ orgId: org.id, userId, email: userEmail ?? "", fullName: userFullName ?? null, role: "Admin" });
  res.status(201).json({ ...org, myRole: "Admin" });
});

// POST /api/orgs/join — join via invite code (can join multiple orgs)
router.post("/join", requireAuth, async (req, res) => {
  const userId = (req as any).userId as string;
  const { inviteCode, userEmail, userFullName } = req.body;
  if (!inviteCode) { res.status(400).json({ error: "inviteCode is required" }); return; }

  const [org] = await db.select().from(organizationsTable).where(eq(organizationsTable.inviteCode, inviteCode as string));
  if (!org) { res.status(404).json({ error: "Invalid invite code" }); return; }

  // Check not already a member of THIS org
  const [existing] = await db.select().from(orgMembersTable)
    .where(and(eq(orgMembersTable.userId, userId), eq(orgMembersTable.orgId, org.id)));
  if (existing) { res.status(409).json({ error: "You are already a member of this organization" }); return; }

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

// POST /api/orgs/:orgId/invite — add member by email
router.post("/:orgId/invite", requireAuth, async (req, res) => {
  const orgId = req.params.orgId as string;
  const { email, fullName, role } = req.body;
  if (!email) { res.status(400).json({ error: "email is required" }); return; }

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
