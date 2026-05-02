import { db, orgMembersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import type { Request, Response, NextFunction } from "express";

export async function requireOrg(req: Request, res: Response, next: NextFunction) {
  const userId = (req as any).userId as string;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const [member] = await db
    .select()
    .from(orgMembersTable)
    .where(eq(orgMembersTable.userId, userId))
    .limit(1);

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
