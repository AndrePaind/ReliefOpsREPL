import { logger } from "./logger";

let resend: any = null;

function getResend() {
  if (resend) return resend;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  try {
    const { Resend } = require("resend");
    resend = new Resend(apiKey);
    return resend;
  } catch {
    return null;
  }
}

export async function sendTaskAssignmentEmail(params: {
  volunteerEmail: string;
  volunteerName: string;
  taskType: string;
  orgName: string;
  startsAt?: Date | null;
}) {
  const client = getResend();
  if (!client) {
    logger.warn("Resend not configured — skipping task assignment email");
    return;
  }
  try {
    await client.emails.send({
      from: "ReliefOps <noreply@reliefops.app>",
      to: params.volunteerEmail,
      subject: `[ReliefOps] New task assigned: ${params.taskType}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
          <div style="background:#f97316;padding:24px;border-radius:12px 12px 0 0">
            <h1 style="color:white;margin:0;font-size:20px">ReliefOps</h1>
            <p style="color:rgba(255,255,255,0.85);margin:4px 0 0">Sudan Operations Platform</p>
          </div>
          <div style="background:#fff;padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px">
            <p style="font-size:16px;color:#1e293b">Hi <strong>${params.volunteerName}</strong>,</p>
            <p style="color:#475569">You have been assigned a new task by <strong>${params.orgName}</strong>.</p>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:16px 0">
              <p style="margin:0;font-weight:600;color:#1e293b">Task: ${params.taskType}</p>
              ${params.startsAt ? `<p style="margin:8px 0 0;color:#64748b;font-size:14px">Starts: ${params.startsAt.toLocaleString()}</p>` : ""}
            </div>
            <p style="color:#64748b;font-size:14px">Please log in to ReliefOps to view full details and update your status.</p>
          </div>
        </div>
      `,
    });
  } catch (err) {
    logger.error({ err }, "Failed to send task assignment email");
  }
}
