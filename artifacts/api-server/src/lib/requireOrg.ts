import { db, orgMembersTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import type { Request, Response, NextFunction } from "express";

export async function requireOrg(req: Request, res: Response, next: NextFunction) {
  const userId = (req as any).userId as string;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  // Check for an explicit org preference from the frontend switcher
  const requestedOrgId = req.headers["x-org-id"] as string | undefined;

  let member;
  if (requestedOrgId) {
    // Validate the user is actually a member of the requested org
    const [m] = await db
      .select()
      .from(orgMembersTable)
      .where(and(eq(orgMembersTable.userId, userId), eq(orgMembersTable.orgId, requestedOrgId)))
      .limit(1);
    member = m;
  }

  // Fall back to most recently joined org
  if (!member) {
    const [m] = await db
      .select()
      .from(orgMembersTable)
      .where(eq(orgMembersTable.userId, userId))
      .orderBy(desc(orgMembersTable.joinedAt))
      .limit(1);
    member = m;
  }

  if (!member) {
    res.status(403).json({ error: "no_org", message: "You must create or join an organization first" });
    return;
  }

  (req as any).orgId = member.orgId;
  (req as any).orgRole = member.role;
  next();
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if ((req as any).orgRole !== "Admin") {
    res.status(403).json({ error: "Admin role required" });
    return;
  }
  next();
}
