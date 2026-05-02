import { db } from "@workspace/db";
import { activityLogTable } from "@workspace/db";

export async function logActivity(params: {
  orgId?: string | null;
  actorId?: string | null;
  entityType: string;
  entityId: string;
  action: string;
  payload?: Record<string, unknown>;
}) {
  try {
    await db.insert(activityLogTable).values({
      orgId: params.orgId ?? null,
      actorId: params.actorId ?? null,
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      payload: params.payload ?? {},
    });
  } catch {
    // non-fatal
  }
}
